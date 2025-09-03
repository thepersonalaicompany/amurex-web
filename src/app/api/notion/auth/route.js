import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { source = "settings" } = await request.json();

    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.NOTION_REDIRECT_URI);
    const state = source; // Use the source as the state parameter

    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}&state=${state}`;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          error: "Missing Notion configuration in environment variables",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: authUrl });
  } catch (error) {
    console.error("Error in Notion auth route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
