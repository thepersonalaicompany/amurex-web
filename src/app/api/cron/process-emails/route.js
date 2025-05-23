import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

// Create a Supabase client with the service key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure Vercel Cron
export const dynamic = 'force-dynamic';
export const maxDuration = 800; // 13 minutes in seconds
export const revalidate = 0;
export const runtime = 'nodejs';

// Vercel Cron configuration - updated to run every hour
export const schedule = "*/15 * * * *"; // Cron syntax: every 15 minutes

// Helper function to validate token by making a simple API call
async function validateGmailAccess(userId, refreshToken, clientsMap) {
  try {
    // console.log(`Validating Gmail access for user ${userId}`);
    
    // Get the client credentials from the map
    const userData = clientsMap[userId];
    if (!userData) {
      throw new Error("Client credentials not found for user");
    }

    // Create the OAuth client using the cached client data
    const oauth2Client = new google.auth.OAuth2(
      userData.client_id,
      userData.client_secret,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    // Set credentials
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Create Gmail API client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Make API calls that require the specific scopes we need:
    // 1. Try to get labels (requires gmail.labels)
    const labels = await gmail.users.labels.list({ userId: 'me' });
    
    // 2. Try to modify a label (requires gmail.modify)
    // Use a dummy modification on an existing label just to test permissions
    if (labels.data.labels && labels.data.labels.length > 0) {
      const testLabelId = labels.data.labels[0].id;
      // We're not actually changing anything, just checking permissions
      await gmail.users.labels.get({
        userId: 'me',
        id: testLabelId
      });
    } else {
      // If no labels, we need to check permissions another way for gmail.modify
      // Try to get a message to test gmail.readonly
      const messages = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 1
      });
      
      if (messages.data.messages && messages.data.messages.length > 0) {
        // Try to get a message (requires gmail.readonly)
        await gmail.users.messages.get({
          userId: 'me',
          id: messages.data.messages[0].id
        });
      }
    }
    
    // If we get here, the token is valid and has the required scopes
    return { valid: true };
  } catch (error) {
    // console.error(`Token validation failed for user ${userId}`);
    
    // Check for specific error types that indicate permission issues
    const errorMessage = error.message || "";
    const errorCode = error.code || "";
    const status = error.status || (error.response && error.response.status);
    
    if (status === 401 || status === 403 || 
        errorMessage.includes("insufficient authentication") ||
        errorMessage.includes("invalid_grant") ||
        errorMessage.includes("invalid credentials") ||
        errorMessage.includes("insufficient permission") ||
        errorCode === "EAUTH") {
      return { 
        valid: false, 
        reason: "insufficient_permissions", 
        message: "User needs to reconnect their Google account with gmail.readonly, gmail.modify, and gmail.labels permissions" 
      };
    }
    
    // For other types of errors (network, etc.), we'll still return invalid but with a different reason
    return { 
      valid: false, 
      reason: "error", 
      message: errorMessage || "Unknown error" 
    };
  }
}

export async function GET(req) {
  // Verify this is a legitimate cron job request
  // const authHeader = req.headers.get('authorization');
  // if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    // Get the latest email record for each unique email address
    const { data: userGmails, error: userGmailsError } = await supabaseAdmin
      .from("user_gmails")
      .select("id, user_id, email_address, refresh_token, google_cohort")
      .not("refresh_token", "is", null)
      .order("created_at", { ascending: false });

    if (userGmailsError) {
      console.error("Error fetching user_gmails:", userGmailsError);
      return NextResponse.json({ 
        success: false, 
        error: "Error fetching user_gmails" 
      }, { status: 500 });
    }

    // Filter to keep only the latest record for each email_address
    const emailMap = new Map();
    const uniqueUserGmails = userGmails.filter(record => {
      if (!emailMap.has(record.email_address)) {
        emailMap.set(record.email_address, true);
        return true;
      }
      return false;
    });

    if (!uniqueUserGmails || uniqueUserGmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No user gmail records found" 
      });
    }

    console.log(`Processing emails for ${uniqueUserGmails.length} gmail accounts via cron job`);
    
    // Get unique cohort IDs directly from the user_gmails records
    const cohortIds = [...new Set(uniqueUserGmails.map(record => record.google_cohort))].filter(id => id !== null);
    
    // Fetch all client credentials in a single query
    const { data: clientsData, error: clientsError } = await supabaseAdmin
      .from('google_clients')
      .select('id, client_id, client_secret')
      .in('id', cohortIds.length > 0 ? cohortIds : [0]); // Use dummy ID if empty
      
    if (clientsError) {
      console.error("Error fetching client credentials:", clientsError);
      return NextResponse.json({ 
        success: false, 
        error: "Error fetching client credentials" 
      }, { status: 500 });
    }
    
    // Create a map of client credentials by cohort ID for quick lookup
    const clientsMap = {};
    for (const client of clientsData) {
      clientsMap[client.id] = client;
    }
    
    // Create a user map that includes client credentials
    const userClientMap = {};
    for (const record of uniqueUserGmails) {
      const userId = record.user_id;
      const cohortId = record.google_cohort;
      
      if (cohortId && clientsMap[cohortId]) {
        userClientMap[userId] = {
          client_id: clientsMap[cohortId].client_id,
          client_secret: clientsMap[cohortId].client_secret,
          refresh_token: record.refresh_token
        };
      }
    }
    
    const results = [];
    
    // Process emails for each unique gmail record
    for (const record of uniqueUserGmails) {
      try {
        const userId = record.user_id;
        const refreshToken = record.refresh_token;
        
        // Skip records without client credentials
        if (!userClientMap[userId]) {
          console.log(`Skipping user ${userId} - client credentials not found`);
          results.push({
            userId,
            email: record.email_address,
            success: false,
            error: "Client credentials not found",
            reason: "configuration_error"
          });
          continue;
        }
        
        // First validate that the token has the required permissions
        const validation = await validateGmailAccess(userId, refreshToken, userClientMap);
        
        if (!validation.valid) {
          console.log(`Skipping user ${userId} (${record.email_address}) - invalid token: ${validation.reason}`);
          results.push({
            userId,
            email: record.email_address,
            success: false,
            error: validation.message || "Token validation failed",
            reason: validation.reason
          });
          continue; // Skip to the next record
        }
        
        // Token is valid, proceed with processing
        console.log(`Token validated for user ${userId} (${record.email_address}), proceeding to process emails`);

        // Get client credentials for this user
        const clientCredentials = userClientMap[userId];

        // Call the process-labels endpoint for this user with useGroq flag
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/process-labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            maxEmails: 3,  // Fetch 3 emails every 15 minutes
            googleClientId: clientCredentials.client_id,
            googleClientSecret: clientCredentials.client_secret,
            refreshToken: clientCredentials.refresh_token,
          })
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
          results.push({
            userId,
            email: record.email_address,
            processed: responseData.processed || 0,
            total_stored: responseData.total_stored || 0,
            message: responseData.message || "Processed successfully"
          });
        } else {
          results.push({
            userId,
            email: record.email_address,
            error: responseData.error || "Unknown error",
            success: false
          });
        }
        
      } catch (userError) {
        console.error(`Error processing emails for user ${record.user_id} (${record.email_address}):`, userError);
        results.push({
          userId: record.user_id,
          email: record.email_address,
          error: userError.message || "Unknown error",
          success: false
        });
      }
      
      // Add a small delay between processing users to avoid rate limits
      // await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({ 
      success: true, 
      message: "Cron job completed", 
      results 
    });
    
  } catch (error) {
    console.error("Error in cron job:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error in cron job: " + (error.message || "Unknown error") 
    }, { status: 500 });
  }
}
