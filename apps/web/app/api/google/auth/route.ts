import { NextResponse, NextRequest } from "next/server";
import { getOAuth2ClientForGoogle as getOAuth2Client } from "./lib";
import { PostRequestBody } from "./types";

export async function GET() {
  // For GET requests, we don't have a userId, so use default client
  const { oauth2Client } = await getOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.labels",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  return NextResponse.redirect(url);
}

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      source = "settings",
      upgradeToFull = false,
    }: PostRequestBody = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    // Get OAuth client with the appropriate credentials
    const { oauth2Client, clientInfo } = await getOAuth2Client(userId, {
      upgradeToFull,
    });

    // Base scopes for Gmail access
    let scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels",
    ];

    // Add additional scopes for full access
    if (upgradeToFull || clientInfo.type === "full") {
      scopes = [
        ...scopes,
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/documents.readonly",
      ];
    }

    // Include the source and client info in the state parameter
    // Format: userId:source:clientId:clientType
    const state = `${userId}:${source}:${clientInfo.id}:${clientInfo.type}`;

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: state,
    });

    // We no longer update the user's google_cohort and google_token_version here
    // This is now done in the callback route after successful authentication

    // We no longer increment the user count here
    // The count is now incremented in the callback route after successful authentication

    return NextResponse.json({ success: true, url: authUrl });
  } catch (error) {
    console.error("Error creating Google auth URL:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
