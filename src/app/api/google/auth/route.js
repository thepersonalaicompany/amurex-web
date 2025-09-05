import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get OAuth client - always uses client ID 10
async function getOAuth2Client() {
  try {
    const { data: client, error } = await supabase
      .from('google_clients')
      .select('id, client_id, client_secret, type')
      .eq('id', 10)
      .single();

    if (error) throw error;

    return {
      oauth2Client: new google.auth.OAuth2(
        client.client_id,
        client.client_secret,
        process.env.GOOGLE_REDIRECT_URI_NEW
      ),
      clientInfo: client
    };
  } catch (error) {
    console.error("Error fetching Google client ID 10:", error);
    throw new Error("Unable to initialize Google OAuth client");
  }
}

export async function GET(req) {
  // For GET requests, use client ID 10
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
    
    // Always get client ID 10
    const { oauth2Client, clientInfo } = await getOAuth2Client();
    
    // Gmail scopes only
    const scopes = [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels",
    ];

    // Include the source and client info in the state parameter
    // Format: userId:source:clientId:clientType
    const state = `${userId}:${source}:${clientInfo.id}:${clientInfo.type}`;
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: state
    });
    
    return NextResponse.json({ 
      success: true, 
      url: authUrl
    });
  } catch (error) {
    console.error('Error creating Google auth URL:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
