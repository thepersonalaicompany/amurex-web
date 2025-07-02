import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  source?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: RequestBody = await request.json();
    const { source = "settings" } = body;

    const clientId = process.env.NOTION_CLIENT_ID;
    const rawRedirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId || !rawRedirectUri) {
      return NextResponse.json(
        {
          error: "Missing Notion configuration in environment variables",
        },
        { status: 500 },
      );
    }

    const redirectUri = encodeURIComponent(rawRedirectUri);
    const state = source;
    const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}&state=${state}`;

    return NextResponse.json({ url: authUrl });
  } catch (error: unknown) {
    console.error("Error in Notion auth:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
