import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get OAuth2 client based on user signup date
async function getOAuth2Client(userId) {
  try {
    // Query Supabase for user's created_at timestamp
    const { data, error } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const cutoffDate = new Date('2025-03-28T08:33:14.69671Z');
    const userSignupDate = new Date(data.created_at);

    // Use old credentials for users who signed up before the cutoff date
    if (userSignupDate < cutoffDate) {
      return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID_OLD,
        process.env.GOOGLE_CLIENT_SECRET_OLD,
        process.env.GOOGLE_REDIRECT_URI_OLD
      );
    } else {
      // Use new credentials for users who signed up after the cutoff date
      return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID_NEW,
        process.env.GOOGLE_CLIENT_SECRET_NEW,
        process.env.GOOGLE_REDIRECT_URI_NEW
      );
    }
  } catch (error) {
    console.error("Error checking user signup date:", error);
    // Fallback to old credentials if there's an error
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID_OLD,
      process.env.GOOGLE_CLIENT_SECRET_OLD,
      process.env.GOOGLE_REDIRECT_URI_OLD
    );
  }
}

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

    // Get the appropriate OAuth client based on user signup date
    const oauth2Client = await getOAuth2Client(userId);

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

    // Get the appropriate OAuth client based on user signup date
    const oauth2Client = await getOAuth2Client(userId);

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
