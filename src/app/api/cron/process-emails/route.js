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
export const maxDuration = 300; // 5 minutes in seconds
export const revalidate = 0;
export const runtime = 'nodejs';

// Vercel Cron configuration - updated to run every hour
export const schedule = "0 * * * *"; // Cron syntax: at minute 0 of every hour

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
    // Get all users with email tagging enabled using the admin client
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email_tagging_enabled, google_refresh_token, google_cohort")
      .eq("email", "arsenfounder@gmail.com");
      // .eq("email_tagging_enabled", true)
      // .not("google_refresh_token", "is", null)
      // .order("created_at", { ascending: false });

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json({ 
        success: false, 
        error: "Error fetching users" 
      }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No users with email tagging enabled" 
      });
    }

    console.log(`Processing emails for ${users.length} users via cron job`);
    
    // Get unique cohort IDs from all users
    const cohortIds = [...new Set(users.map(user => user.google_cohort))].filter(id => id !== null);
    
    // Fetch all client credentials in a single query
    const { data: clientsData, error: clientsError } = await supabaseAdmin
      .from('google_clients')
      .select('id, client_id, client_secret')
      .in('id', cohortIds.length > 0 ? cohortIds : [0]); // Use a dummy ID if empty to avoid query error
      
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
    for (const user of users) {
      if (clientsMap[user.google_cohort]) {
        userClientMap[user.id] = {
          client_id: clientsMap[user.google_cohort].client_id,
          client_secret: clientsMap[user.google_cohort].client_secret,
          refresh_token: user.google_refresh_token
        };
      }
    }
    
    const results = [];
    
    // Process emails for each user by calling the process-labels endpoint
    for (const user of users) {
      try {
        const userId = user.id;
        const refreshToken = user.google_refresh_token;
        
        // Skip users without client credentials
        if (!userClientMap[userId]) {
          console.log(`Skipping user ${userId} - client credentials not found`);
          results.push({
            userId,
            success: false,
            error: "Client credentials not found",
            reason: "configuration_error"
          });
          continue;
        }
        
        // First validate that the token has the required permissions
        const validation = await validateGmailAccess(userId, refreshToken, userClientMap);
        
        if (!validation.valid) {
          console.log(`Skipping user ${userId} - invalid token: ${validation.reason}`);
          results.push({
            userId,
            success: false,
            error: validation.message || "Token validation failed",
            reason: validation.reason
          });
          continue; // Skip to the next user
        }
        
        // Token is valid, proceed with processing
        console.log(`Token validated for user ${userId}, proceeding to process emails`);

        // Call the process-labels endpoint for this user with useGroq flag
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/process-labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            useGroq: true  // Add flag to use Groq instead of OpenAI
          })
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
          results.push({
            userId,
            processed: responseData.processed || 0,
            total_stored: responseData.total_stored || 0,
            message: responseData.message || "Processed successfully"
          });
        } else {
          results.push({
            userId,
            error: responseData.error || "Unknown error",
            success: false
          });
        }
        
      } catch (userError) {
        console.error(`Error processing emails for user ${user.id}:`, userError);
        results.push({
          userId: user.id,
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
