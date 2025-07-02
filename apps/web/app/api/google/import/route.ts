import { NextResponse } from "next/server";
import { CreateClientWithAccessToken } from "@amurex/supabase";
import { processGoogleDocs } from "./lib";
import { supabaseAdminClient } from "@amurex/supabase";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | string | null;
}

export async function POST(req: Request) {
  try {
    const requestData = await req.json();
    const {
      userId,
      accessToken,
      googleAccessToken,
      googleRefreshToken,
      googleTokenExpiry,
    } = requestData as {
      userId: string;
      accessToken?: string;
      googleAccessToken?: string;
      googleRefreshToken?: string;
      googleTokenExpiry?: number;
    };

    let userEmail = req.headers.get("x-user-email");

    // Create Supabase client - either with the provided access token or with service role
    let supabaseClient;
    if (accessToken) {
      // Client-side request with Supabase access token
      supabaseClient = CreateClientWithAccessToken(
        accessToken,
        process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      );
    } else {
      // Server-side request (from callback) without Supabase token
      // initialize supabase admin client with service role key
      supabaseClient = supabaseAdminClient(
        process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      );
    }

    // Check user's Google token version
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select(
        "email, google_token_version, google_access_token, google_refresh_token, google_token_expiry",
      )
      .eq("id", userId)
      .single();

    if (userError) {
      throw new Error("Failed to fetch user data: " + userError.message);
    }

    // Get user email from Supabase if not in headers
    if (!userEmail && userData?.email) {
      userEmail = userData.email;
    }

    // Use provided Google tokens if available, otherwise use stored tokens
    const googleTokens: GoogleTokens = {
      access_token: googleAccessToken || userData?.google_access_token, // TODO?:had to use optional chaining
      refresh_token: googleRefreshToken || userData?.google_refresh_token,
      expiry_date: googleTokenExpiry || userData?.google_token_expiry,
    };

    // Only process Google Docs if token version is "full"
    let docsResults: any[] = [];
    if (userData?.google_token_version === "full") {
      // Process the documents using the appropriate tokens
      docsResults = await processGoogleDocs({ id: userId }, googleTokens);

      // Send email notification if documents were processed
      if (docsResults.length > 0) {
        await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userEmail: userEmail,
              importResults: docsResults,
              platform: "google_docs",
            }),
          },
        );
      }
    } else {
      console.log("Skipping Google Docs import - token version is not 'full'");
      docsResults = [{ status: "skipped", reason: "Insufficient permissions" }];
    }

    // Process Gmail emails by calling the existing Gmail process-labels endpoint
    // TODO: remove any
    let gmailResults: any = {
      success: false,
      error: "Gmail processing not attempted",
    };
    try {
      const gmailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/process-labels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            maxEmails: 20,
          }),
        },
      );

      gmailResults = await gmailResponse.json();
      console.log("Gmail processing results:", gmailResults);
    } catch (gmailError: any) {
      console.error("Error processing Gmail:", gmailError);
      gmailResults = {
        success: false,
        error: gmailError.message || "Failed to process Gmail",
      };
    }

    return NextResponse.json({
      success: true,
      message: "Import complete. Check your email for details.",
      documents: docsResults.map((result) => ({
        id: result.id,
        title: result.title || `Document ${result.id}`,
        status: result.status,
      })),
      gmail: gmailResults,
    });
  } catch (error: any) {
    console.error("Error initiating Google import:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    // Get user ID from the URL query parameters
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    // initialize supabase admin client with service role key
    const adminSupabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Check user's Google token version
    const { data: userData, error: userError } = await adminSupabase
      .from("users")
      .select("google_token_version")
      .eq("id", userId)
      .single();

    if (userError) {
      throw new Error("Failed to fetch user data: " + userError.message);
    }

    // Only process Google Docs if token version is "full"
    let docsResults: any[] = [];
    if (userData?.google_token_version === "full") {
      // Process the documents
      docsResults = await processGoogleDocs({ id: userId });
    } else {
      console.log("Skipping Google Docs import - token version is not 'full'");
      docsResults = [{ status: "skipped", reason: "Insufficient permissions" }];
    }

    // Process Gmail emails by calling the existing Gmail process-labels endpoint
    let gmailResults: any = {
      success: false,
      error: "Gmail processing not attempted",
    };
    try {
      const gmailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/process-labels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId,
            useStandardColors: false,
          }),
        },
      );

      gmailResults = await gmailResponse.json();
      console.log("Gmail processing results:", gmailResults);
    } catch (gmailError: any) {
      console.error("Error processing Gmail:", gmailError);
      gmailResults = {
        success: false,
        error: gmailError.message || "Failed to process Gmail",
      };
    }

    return NextResponse.json({
      success: true,
      message: "Import complete",
      documents: docsResults.map((result) => ({
        id: result.id,
        title: result.title || `Document ${result.id}`,
        status: result.status,
      })),
      gmail: gmailResults,
    });
  } catch (error: any) {
    console.error("Error fetching Google data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
