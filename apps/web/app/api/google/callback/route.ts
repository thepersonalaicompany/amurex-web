import { NextResponse, NextRequest } from "next/server";
import { supabaseAdminClient } from "@amurex/supabase";
import { getOauth2Client } from "@amurex/web/lib";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Handle error from Google
  if (error) {
    console.error("Google auth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=google_auth_failed`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`,
    );
  }

  try {
    // Parse state parameter to get userId, source, clientId, and clientType
    // Format: userId:source:clientId:clientType
    const [userId, source, clientId, clientType] = state!.split(":");

    console.log("Callback received:", {
      userId,
      source,
      clientId,
      clientType,
      code: code.substring(0, 10) + "...",
    });

    if (!userId || !clientId) {
      console.error("Invalid state parameter:", state);
      throw new Error("Invalid state parameter");
    }

    // initialize supabase admin client with service role key
    const supabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Get the client credentials from the database
    const { data: clientData, error: clientError } = await supabase
      .from("google_clients")
      .select("client_id, client_secret")
      .eq("id", clientId)
      .single();

    if (clientError) {
      console.error("Error fetching client data:", clientError);
      throw clientError;
    }

    console.log("Client data retrieved:", {
      clientId: clientData!.client_id.substring(0, 10) + "...",
    });

    // get OAuth2 client with the correct credentials
    const oauth2Client = getOauth2Client({
      userData: {
        client_id: clientData.client_id,
        client_secret: clientData.client_secret,
      },
    });

    console.log(
      "OAuth client created with redirect URI:",
      process.env.GOOGLE_REDIRECT_URI_NEW,
    );

    // Exchange code for tokens
    console.log("Exchanging code for tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Tokens received:", {
      access_token: tokens.access_token ? "present" : "missing",
      refresh_token: tokens.refresh_token ? "present" : "missing",
    });

    console.log("tokens", tokens);

    // Store tokens in database and assign the Google client to this user
    // This is now the ONLY place where we assign clients to users, ensuring it only happens on successful auth
    const { error: tokenError } = await supabase
      .from("users")
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: new Date(tokens.expiry_date!).toISOString(),
        google_token_version: clientType, // Assigns the client type to the user
        google_cohort: clientId, // Assigns the specific client to the user
      })
      .eq("id", userId);

    if (tokenError) {
      console.error("Error storing tokens:", tokenError);
      throw tokenError;
    }

    // Increment the user_count for this client after successful token exchange and assignment
    // This ensures we only count users who complete the full OAuth flow
    console.log("Incrementing client user count for client:", clientId);
    const { error: countError } = await supabase.rpc(
      "increment_google_client_user_count",
      {
        client_id_param: clientId,
      },
    );

    if (countError) {
      console.error("Error incrementing client user count:", countError);
      // Continue anyway since this is not critical
    }

    console.log(
      "Google connection successful for user:",
      userId,
      "with client:",
      clientId,
      "of type:",
      clientType,
    );

    // Determine redirect URL based on source
    let redirectUrl;
    if (source === "onboarding") {
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/complete`;
    } else if (source === "search") {
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/search?connection=success&source=google`;
    } else {
      redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?connection=success&source=google`;
    }

    // Start background processes - no need to wait for these to complete
    // Process Gmail labels for all token versions
    (async () => {
      try {
        console.log("Starting Gmail label processing for user:", userId);

        // Call the existing Gmail process-labels API endpoint
        const response = await fetch(
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

        const result = await response.json();
        console.log("Gmail label processing result:", result);
      } catch (error) {
        console.error("Error in Gmail label processing:", error);
      }
    })();

    // Import Google Docs only if token version is "full"
    if (clientType === "full") {
      (async () => {
        try {
          console.log("Starting Google Docs import for user:", userId);

          // Call the existing Google import API endpoint with POST method
          // Pass the Google tokens directly in the request body
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/google/import`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: userId,
                googleAccessToken: tokens.access_token,
                googleRefreshToken: tokens.refresh_token,
                googleTokenExpiry: tokens.expiry_date,
              }),
            },
          );

          const result = await response.json();
          console.log("Google Docs import result:", result);
        } catch (error) {
          console.error("Error in Google Docs import:", error);
        }
      })();
    }

    // Redirect the user immediately, while background processes continue
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error in Google callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed`,
    );
  }
}
