import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabaseClient';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ success: false, error: 'No code provided' }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.access_token) {
      return NextResponse.json({
        success: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        state: state
      });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to connect Google Docs' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { access_token, refresh_token, state, userId } = await req.json();
    console.log('access_token', access_token);

    const { data, error } = await supabase
      .from('users')
      .update({
        google_access_token: access_token,
        google_refresh_token: refresh_token,
        google_docs_connected: true
      })
      .eq('id', userId)
      .select();
    
    const { data: newData, error: newError } = await supabase
      .from('users')
      .select();

    console.log('New Data:', newData);

    console.log('Data:', data);
    console.log('Error:', error);

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Google callback POST:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
