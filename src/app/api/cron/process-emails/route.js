import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(req) {
  // Verify this is a legitimate cron job request
  const authHeader = req.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all users with email tagging enabled using the admin client
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email_tagging_enabled")
      .eq("email_tagging_enabled", true)
      .not("google_refresh_token", "is", null);

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
    
    const results = [];
    
    // Process emails for each user by calling the process-labels endpoint
    for (const user of users) {
      try {
        const userId = user.id;
        
        // Call the process-labels endpoint for this user with useGroq flag
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/process-labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            useStandardColors: false,
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
      await new Promise(resolve => setTimeout(resolve, 1000));
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
