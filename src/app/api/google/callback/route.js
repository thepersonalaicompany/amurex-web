import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  console.log('Callback route hit');
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    console.log('Code:', code);
    console.log('State:', state);

    if (!code) {
      throw new Error('No code provided');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Get tokens from Google
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Got tokens from Google');

    // Update the user's tokens in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_docs_connected: true,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: new Date(tokens.expiry_date).toISOString(),
      })
      .eq('id', state);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      throw updateError;
    }

    // Redirect back to the settings page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?connection=success`
    );

  } catch (error) {
    console.error('Callback error:', error);
    // Redirect with error
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${encodeURIComponent(error.message)}`
    );
  }
}

export async function POST(req) {
  try {
    const { code, state, userId } = await req.json();

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_docs_connected: true,
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: new Date(tokens.expiry_date).toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error storing tokens:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to store Google credentials' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
