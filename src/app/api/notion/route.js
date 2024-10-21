import { NextResponse } from 'next/server';

export async function GET() {
  const authUrl = process.env.NOTION_AUTH_URL;

  if (!authUrl) {
    return NextResponse.json({ error: 'NOTION_AUTH_URL is not set in environment variables' }, { status: 500 });
  }

  return NextResponse.redirect(authUrl);
}
