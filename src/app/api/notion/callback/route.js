import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ success: false, error: 'No code provided' }, { status: 400 });
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

    if (data.error) {
      console.error('Notion API error:', data);
      return NextResponse.json({ success: false, error: data.error_description || data.error }, { status: 400 });
    }

    if (data.access_token) {
      // Send the data back to the client to handle
      return NextResponse.json({
        success: true,
        access_token: data.access_token,
        workspace_id: data.workspace_id,
        bot_id: data.bot_id,
        state: state
      });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to connect Notion' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Notion callback:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { access_token, workspace_id, bot_id, state, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'No active session' }, { status: 401 });
    }

    const { error } = await supabase
      .from('users')
      .update({
        notion_connected: true,
        notion_access_token: access_token,
        notion_workspace_id: workspace_id,
        notion_bot_id: bot_id,
      })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ success: false, error: 'Failed to update user profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Notion connected successfully' });
  } catch (error) {
    console.error('Error in Notion callback:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

