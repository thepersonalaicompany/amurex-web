import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect('/settings?error=No code provided');
  }

  try {
    const response = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.NOTION_REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase
          .from('users')
          .update({ 
            notion_connected: true,
            notion_access_token: data.access_token,
            notion_workspace_id: data.workspace_id,
            notion_bot_id: data.bot_id,
          })
          .eq('id', session.user.id);
      }
      return NextResponse.redirect('/?notionConnected=true');
    } else {
      return NextResponse.redirect('/settings?error=Failed to connect Notion');
    }
  } catch (error) {
    console.error('Error connecting Notion:', error);
    return NextResponse.redirect('/settings?error=Failed to connect Notion');
  }
}
