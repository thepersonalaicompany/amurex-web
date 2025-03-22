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
    const stateParam = searchParams.get('state');
    
    // Parse state parameter which includes userId:source format
    const [userId, source = 'settings'] = stateParam ? stateParam.split(':') : [stateParam, 'settings'];
    
    console.log('Code:', code);
    console.log('User ID:', userId);
    console.log('Source:', source);

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
      .eq('id', userId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      throw updateError;
    }

    // Redirect based on source
    const redirectUrl = source === 'onboarding' 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?connection=success`
      : `${process.env.NEXT_PUBLIC_APP_URL}/settings?connection=success`;
    
    console.log('Redirecting to:', redirectUrl);
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Callback error:', error);
    
    // Get source from state parameter
    const stateParam = req.nextUrl.searchParams.get('state');
    const [, source = 'settings'] = stateParam ? stateParam.split(':') : [null, 'settings'];
    
    const redirectUrl = source === 'onboarding'
      ? `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?error=${encodeURIComponent(error.message)}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=${encodeURIComponent(error.message)}`;
    
    return NextResponse.redirect(redirectUrl);
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { code, state, userId, source = 'settings' } = body;
    
    console.log('POST callback received:', { code: !!code, state, userId, source });

    if (!code) {
      return NextResponse.json({ 
        success: false, 
        error: 'No code provided',
        source
      }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      console.log('Tokens received from Google');

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
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to store Google credentials',
          source
        }, { status: 500 });
      }

      return NextResponse.json({ success: true, source });
    } catch (tokenError) {
      console.error('Error exchanging code for tokens:', tokenError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to exchange code for tokens: ' + tokenError.message,
        source
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error: ' + error.message,
      source: 'settings'
    }, { status: 500 });
  }
}
