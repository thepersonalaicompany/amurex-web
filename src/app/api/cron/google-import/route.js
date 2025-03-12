import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Configure Vercel Cron
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes in seconds
export const revalidate = 0;

// Vercel Cron configuration
export const config = {
  cron: "*/5 * * * *" // Cron syntax: every 5 minutes
};

export async function GET(req) {
  try {
    // Verify the cron job secret using Authorization header
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get all users with Google credentials
    const { data: users, error } = await supabase
      .from("users")
      .select("id")
      .not("google_access_token", "is", null);

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users with Google credentials found",
        processedUsers: 0,
        results: []
      });
    }

    console.log(`Found ${users.length} users with Google credentials`);

    // Process each user's documents
    const results = [];
    for (const user of users) {
      try {
        console.log(`Processing documents for user ${user.id}`);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/google/import?userId=${user.id}`,
          { method: "GET" }
        );
        
        const result = await response.json();
        console.log(`Result for user ${user.id}:`, result);
        
        results.push({
          userId: user.id,
          success: result.success,
          documentsCount: result.documents?.length || 0,
        });
      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        results.push({
          userId: user.id,
          success: false,
          error: userError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedUsers: results.length,
      results,
    });
  } catch (error) {
    console.error("Error in scheduled Google Docs import:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 