import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.NOTION_REDIRECT_URI);
  const authUrl = `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}`;

  if (!authUrl) {
    return NextResponse.json({ error: 'NOTION_AUTH_URL is not set in environment variables' }, { status: 500 });
  }

  return NextResponse.redirect(authUrl);
}
