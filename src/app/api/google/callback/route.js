import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { code, userId, source = 'settings' } = await request.json();
    
    if (!code || !userId) {
      return NextResponse.json({ success: false, error: 'Code and user ID are required' }, { status: 400 });
    }
    
    // Always use client ID 2 as requested
    const clientId = 2;
    
    // Fetch the client credentials directly from the database using admin client
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('google_clients')
      .select('client_id, client_secret')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.error('Client fetch error:', clientError);
      throw new Error(`Failed to fetch Google client credentials: ${clientError.message}`);
    }
    
    if (!clientData) {
      throw new Error('No Google client credentials found for ID 2');
    }
    
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/callback/google`;
    
    console.log('Using client ID:', clientData.client_id);
    console.log('Using client secret:', clientData.client_secret);
    console.log('Redirect URI:', redirectUri);
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientData.client_id,
        client_secret: clientData.client_secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('Token exchange error details:', tokenData);
      throw new Error(`Token exchange error: ${tokenData.error}`);
    }
    
    // Store tokens directly in the users table
    // Always set token_version to gmail_only for client ID 2
    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({ 
        google_docs_connected: false, // Set to false since this is gmail_only
        google_token_version: 'gmail_only', // Always set to gmail_only for client ID 2
        google_access_token: tokenData.access_token,
        google_refresh_token: tokenData.refresh_token,
        google_token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
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
