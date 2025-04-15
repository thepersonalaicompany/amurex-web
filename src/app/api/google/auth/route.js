import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get OAuth client based on user's google_token_version
async function getOAuth2Client(userId, { upgradeToFull = false } = {}) {
  try {
    // If no userId provided, get a default gmail_only client for new signups
    if (!userId) {
      const { data: defaultClient, error: defaultError } = await supabase
        .from('google_clients')
        .select('id, client_id, client_secret, type')
        .eq('type', 'gmail_only')
        .limit(1)
        .single();

      if (defaultError) throw defaultError;

      return {
        oauth2Client: new google.auth.OAuth2(
          defaultClient.client_id,
          defaultClient.client_secret,
          process.env.GOOGLE_REDIRECT_URI_NEW
        ),
        clientInfo: defaultClient
      };
    }

    // Query Supabase for user's google_token_version
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('google_token_version')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    let clientData;
    let clientError;

    // For fresh users (no google_token_version yet), assign a default gmail_only client
    if (!userData.google_token_version) {
      const result = await supabase
        .from('google_clients')
        .select('id, client_id, client_secret, type')
        .eq('type', 'gmail_only')
        .lt('users_count', 100)  // Try to find one with fewer users
        .order('users_count', { ascending: true })
        .limit(1)
        .single();
      
      clientData = result.data;
      clientError = result.error;
    }
    // If user's token version is 'old', fetch client with id = 2 (old client)
    else if (userData.google_token_version === 'old') {
      const result = await supabase
        .from('google_clients')
        .select('id, client_id, client_secret, type')
        .eq('type', 'gmail_only')
        .lt('users_count', 100)  // Find clients with fewer than 100 users
        .order('users_count', { ascending: true })  // Get the one with fewest users
        .limit(1)
        .single();
      
      clientData = result.data;
      clientError = result.error;

      // Increment the users_count for this client
      if (clientData && !clientError) {
        const { error: countError } = await supabase.rpc('increment_google_client_user_count', {
          client_id_param: clientData.id
        });
        
        if (countError) {
          console.error('Error incrementing client user count:', countError);
          // Continue anyway since this is not critical
        }
      }
    } 
    // If user's token version is 'gmail_only' and they're trying to upgrade to 'full'
    else if (userData.google_token_version === 'gmail_only' && upgradeToFull) {
      // Find the oldest full client with user_count < 100 for upgrade
      const result = await supabase
        .from('google_clients')
        .select('id, client_id, client_secret, type')
        .eq('type', 'full')
        .lt('users_count', 100)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      
      clientData = result.data;
      clientError = result.error;
    } 
    // If user already has 'full' access, keep using their assigned client
    else if (userData.google_token_version === 'full') {
      // Get the user's assigned google_cohort
      const { data: userCohort, error: cohortError } = await supabase
        .from('users')
        .select('google_cohort')
        .eq('id', userId)
        .single();
        
      if (cohortError) throw cohortError;
      
      // Get the client associated with their cohort
      const result = await supabase
        .from('google_clients')
        .select('id, client_id, client_secret, type')
        .eq('id', userCohort.google_cohort)
        .single();
        
      clientData = result.data;
      clientError = result.error;
    }
    // Otherwise use a gmail_only client for regular users
    else {
      const result = await supabase
        .from('google_clients')
        .select('id, client_id, client_secret, type')
        .eq('type', 'gmail_only')
        .lt('users_count', 100)  // Find clients with fewer than 100 users
        .order('users_count', { ascending: true })  // Get the one with fewest users
        .limit(1)
        .single();
      
      clientData = result.data;
      clientError = result.error;
      
      // Increment the users_count for this client
      if (clientData && !clientError) {
        const { error: countError } = await supabase.rpc('increment_google_client_user_count', {
          client_id_param: clientData.id
        });
        
        if (countError) {
          console.error('Error incrementing client user count:', countError);
          // Continue anyway since this is not critical
        }
      }
    }

    if (clientError) throw clientError;

    return {
      oauth2Client: new google.auth.OAuth2(
        clientData.client_id,
        clientData.client_secret,
        process.env.GOOGLE_REDIRECT_URI_NEW
      ),
      clientInfo: clientData
    };
  } catch (error) {
    console.error("Error fetching Google client credentials:", error);
    
    // As a last resort, try to get any available client
    try {
      const { data: anyClient, error: anyError } = await supabase
        .from('google_clients')
        .select('id, client_id, client_secret, type')
        .limit(1)
        .single();

      if (anyError) throw anyError;

      return {
        oauth2Client: new google.auth.OAuth2(
          anyClient.client_id,
          anyClient.client_secret,
          process.env.GOOGLE_REDIRECT_URI_NEW
        ),
        clientInfo: anyClient
      };
    } catch (fallbackError) {
      console.error("Failed to get any Google client:", fallbackError);
      throw new Error("Unable to initialize Google OAuth client");
    }
  }
}

export async function GET(req) {
  // For GET requests, we don't have a userId, so use default client
  const { oauth2Client } = await getOAuth2Client();
  
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.labels",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  return NextResponse.redirect(url);
}

export async function POST(request) {
  try {
    const { userId, source = 'settings', upgradeToFull = false } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }
    
    // Get OAuth client with the appropriate credentials
    const { oauth2Client, clientInfo } = await getOAuth2Client(userId, { upgradeToFull });
    
    // Base scopes for Gmail access
    let scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels",
    ];

    // Add additional scopes for full access
    if (upgradeToFull || clientInfo.type === 'full') {
      scopes = [
        ...scopes,
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/documents.readonly"
      ];
    }

    // Include the source and client info in the state parameter
    // Format: userId:source:clientId:clientType
    const state = `${userId}:${source}:${clientInfo.id}:${clientInfo.type}`;
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: state
    });
    
    // Update the user's google_cohort and google_token_version to match the client we're using
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        google_cohort: clientInfo.id,
        google_token_version: clientInfo.type
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating user google_cohort:', updateError);
      // Continue anyway since the auth URL is still valid
    }
    
    // Increment the user_count for this client
    const { error: countError } = await supabase.rpc('increment_google_client_user_count', {
      client_id_param: clientInfo.id
    });
    
    if (countError) {
      console.error('Error incrementing client user count:', countError);
      // Continue anyway since this is not critical
    }
    
    return NextResponse.json({ success: true, url: authUrl });
  } catch (error) {
    console.error('Error creating Google auth URL:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
