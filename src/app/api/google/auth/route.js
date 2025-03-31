import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from '@supabase/supabase-js';
import { getGoogleClientCredentials } from '@/lib/googleClient';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Function to get OAuth client based on user signup date
async function getOAuth2Client(userId) {
  if (!userId) {
    // Default to old credentials if no userId provided
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID_OLD,
      process.env.GOOGLE_CLIENT_SECRET_OLD,
      process.env.GOOGLE_REDIRECT_URI_OLD
    );
  }

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
  // For GET requests, we don't have a userId, so use default credentials
  const oauth2Client = await getOAuth2Client();
  
  const scopes = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/documents.readonly",
    // "https://www.googleapis.com/auth/drive.file",
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
    const { userId, source = 'settings' } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }
    
    // Get the appropriate Google client credentials
    const { clientId, clientSecret } = await getGoogleClientCredentials(userId);
    
    // Create the OAuth URL with the fetched credentials
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/callback/google`;
    const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/drive.readonly';
    
    // Include the source in the state parameter
    const state = `${userId}:${source}`;
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
    
    return NextResponse.json({ success: true, url: authUrl });
  } catch (error) {
    console.error('Error creating Google auth URL:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
