import { NextResponse } from 'next/server';
import { getGoogleClientCredentials } from '@/lib/googleClient';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  try {
    const { code, userId, source = 'settings' } = await request.json();
    
    if (!code || !userId) {
      return NextResponse.json({ success: false, error: 'Code and user ID are required' }, { status: 400 });
    }
    
    // Get the appropriate Google client credentials
    const { clientId, clientSecret } = await getGoogleClientCredentials(userId);
    
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/callback/google`;
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`Token exchange error: ${tokenData.error}`);
    }
    
    // Store tokens in the database
    const { error: updateError } = await supabase
      .from('google_tokens')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      });
    
    if (updateError) {
      throw new Error(`Failed to store tokens: ${updateError.message}`);
    }
    
    // Update user's Google connection status
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ 
        google_docs_connected: true,
        google_token_version: source === 'search' ? 'full' : (tokenData.scope.includes('drive') ? 'full' : 'gmail_only')
      })
      .eq('id', userId);
    
    if (userUpdateError) {
      throw new Error(`Failed to update user: ${userUpdateError.message}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
