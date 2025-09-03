import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

// Configure Vercel Cron
export const dynamic = "force-dynamic";
export const maxDuration = 800; // 13 minutes in seconds
export const revalidate = 0;
export const runtime = "nodejs";

// Vercel Cron configuration - updated to run every hour
export const schedule = "0 * * * *"; // Cron syntax: at minute 0 of every hour

// Helper function to validate access with required Google Drive scopes
async function validateGoogleAccess(userId, refreshToken, clientsMap) {
  try {
    // Get the client credentials from the map
    const userData = clientsMap[userId];
    if (!userData) {
      throw new Error("Client credentials not found for user");
    }

    // Create the OAuth client
    const oauth2Client = new google.auth.OAuth2(
      userData.client_id,
      userData.client_secret,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Create Drive API client
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Make API calls that require the specific scopes we need:
    // 1. Try to list files (requires drive.readonly)
    await drive.files.list({
      pageSize: 1,
      fields: "files(id, name)",
    });

    // 2. Try to access docs (requires documents.readonly)
    const docs = google.docs({ version: "v1", auth: oauth2Client });

    // Get a list of docs first
    const filesList = await drive.files.list({
      pageSize: 1,
      q: "mimeType='application/vnd.google-apps.document'",
      fields: "files(id)",
    });

    // If we have at least one doc, try to access it
    if (filesList.data.files && filesList.data.files.length > 0) {
      const docId = filesList.data.files[0].id;
      await docs.documents.get({
        documentId: docId,
      });
    }

    console.log("Token validated successfully for user:", userId);
    // If we get here, the token is valid and has the required scopes
    return { valid: true };
  } catch (error) {
    // Check for specific error types that indicate permission issues
    const errorMessage = error.message || "";
    const errorCode = error.code || "";
    const status = error.status || (error.response && error.response.status);

    if (
      status === 401 ||
      status === 403 ||
      errorMessage.includes("insufficient authentication") ||
      errorMessage.includes("invalid_grant") ||
      errorMessage.includes("invalid credentials") ||
      errorMessage.includes("insufficient permission") ||
      errorCode === "EAUTH"
    ) {
      return {
        valid: false,
        reason: "insufficient_permissions",
        message:
          "User needs to reconnect their Google account with drive.readonly and documents.readonly permissions",
      };
    }

    // For other types of errors (network, etc.), we'll still return invalid but with a different reason
    return {
      valid: false,
      reason: "error",
      message: errorMessage || "Unknown error",
    };
  }
}

export async function GET(req) {
  try {
    // Verify the cron job secret using Authorization header
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get all users with Google credentials
    const { data: users, error } = await supabase
      .from("users")
      .select("id, google_refresh_token, google_cohort")
      .not("google_refresh_token", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users with Google credentials found",
        processedUsers: 0,
        results: [],
      });
    }

    console.log(`Found ${users.length} users with Google credentials`);

    // Get unique cohort IDs from all users
    const cohortIds = [
      ...new Set(users.map((user) => user.google_cohort)),
    ].filter((id) => id !== null);

    // Fetch all client credentials in a single query
    const { data: clientsData, error: clientsError } = await supabase
      .from("google_clients")
      .select("id, client_id, client_secret")
      .in("id", cohortIds.length > 0 ? cohortIds : [0]); // Use a dummy ID if empty to avoid query error

    if (clientsError) {
      console.error("Error fetching client credentials:", clientsError);
      throw new Error(
        `Failed to fetch client credentials: ${clientsError.message}`
      );
    }

    // Create a map of client credentials by cohort ID for quick lookup
    const clientsMap = {};
    for (const client of clientsData) {
      clientsMap[client.id] = client;
    }

    // Create a user map that includes client credentials
    const userClientMap = {};
    for (const user of users) {
      if (user.google_cohort && clientsMap[user.google_cohort]) {
        userClientMap[user.id] = {
          client_id: clientsMap[user.google_cohort].client_id,
          client_secret: clientsMap[user.google_cohort].client_secret,
          refresh_token: user.google_refresh_token,
        };
      }
    }

    // Process each user's documents
    const results = [];
    let skipCount = 0;

    for (const user of users) {
      try {
        console.log(`Processing documents for user ${user.id}`);

        // Skip users without client credentials
        if (!userClientMap[user.id]) {
          console.log(
            `Skipping user ${user.id} - client credentials not found`
          );
          results.push({
            userId: user.id,
            success: false,
            error: "Client credentials not found",
            skipped: true,
          });
          skipCount++;
          continue;
        }

        // Validate access before processing
        const validation = await validateGoogleAccess(
          user.id,
          user.google_refresh_token,
          userClientMap
        );

        if (!validation.valid) {
          console.log(
            `Skipping user ${user.id} - invalid token: ${validation.reason}`
          );
          results.push({
            userId: user.id,
            success: false,
            error: validation.message || "Token validation failed",
            reason: validation.reason,
            skipped: true,
          });
          skipCount++;
          continue;
        }

        // If validation passed, proceed with document import
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/google/import?userId=${user.id}`,
          { method: "GET" }
        );

        const result = await response.json();
        console.log(`Result for user ${user.id}:`, result);

        results.push({
          userId: user.id,
          success: result.success,
          documentsCount: result.documents?.length || 0,
        });
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        results.push({
          userId: user.id,
          success: false,
          error: userError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedUsers: results.length - skipCount,
      skippedUsers: skipCount,
      totalUsers: results.length,
      results,
    });
  } catch (error) {
    console.error("Error in scheduled Google Docs import:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
