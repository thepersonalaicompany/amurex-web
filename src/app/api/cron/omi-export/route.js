import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

// Create a Supabase client with the service key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configure Vercel Cron
export const dynamic = "force-dynamic";
export const maxDuration = 800; // 13 minutes in seconds
export const revalidate = 0;
export const runtime = "nodejs";

// Vercel Cron configuration - updated to run every hour
export const schedule = "0 * * * *"; // Cron syntax: at minute 0 of every hour

async function sendToOmiAPI(omiUid, text) {
  const url = `https://api.omi.me/v2/integrations/01JWF84YVZ6SYKE486KWARA2CK/user/memories?uid=${omiUid}&limit=100&offset=0`;

  // Fire and forget - don't wait for response
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OMI_API_KEY}`,
    },
    body: JSON.stringify({
      text: text,
      text_source: "email",
    }),
  }).catch((error) => {
    console.error("Error sending to OMI API (fire and forget):", error);
  });
}

export async function GET(req) {
  try {
    // Verify the cron job secret using Authorization header
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Starting OMI export cron job...");

    // Get the 'initial' parameter from query string
    const url = new URL(req.url);
    const isInitial = url.searchParams.get("initial") === "true";
    console.log(`Running in ${isInitial ? "initial" : "incremental"} mode`);

    // 1. Get users with OMI connection data
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email, omi_connected, omi_uid")
      .eq("omi_connected", true)
      .not("omi_uid", "is", null);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Error fetching users" },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log("No users with OMI connection found");
      return NextResponse.json(
        { message: "No users to process" },
        { status: 200 }
      );
    }

    console.log(`Found ${users.length} users to process`);

    const results = [];
    let processedCount = 0;
    let errorCount = 0;

    // 2. Process each user
    for (const user of users) {
      try {
        console.log(`Processing user ${user.id} (${user.email})`);

        // Get emails for this user from the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: emails, error: emailsError } = await supabaseAdmin
          .from("emails")
          .select("id, subject, content, sender, received_at")
          .eq("user_id", user.id)
          .modify((query) => {
            if (!isInitial) {
              query.gte("received_at", oneHourAgo);
            } else {
              query.limit(50);
            }
          })
          .order("received_at", { ascending: false });

        if (emailsError) {
          console.error(
            `Error fetching emails for user ${user.id}:`,
            emailsError
          );
          errorCount++;
          continue;
        }

        console.log(`Found ${emails.length} emails for user ${user.id}`);

        // Also get meeting transcripts for this user from the last hour
        const { data: meetings, error: meetingsError } = await supabaseAdmin
          .from("late_meeting")
          .select(
            "id, meeting_id, transcript, summary, meeting_title, meeting_start_time, created_at"
          )
          .contains("user_ids", [user.id])
          .modify((query) => {
            if (!isInitial) {
              query.gte("created_at", oneHourAgo);
            } else {
              query.limit(50);
            }
          })
          .order("created_at", { ascending: false });

        if (meetingsError) {
          console.error(
            `Error fetching meetings for user ${user.id}:`,
            meetingsError
          );
        } else {
          console.log(
            `Found ${meetings?.length || 0} meetings for user ${user.id}`
          );
        }

        const totalItems = emails.length + (meetings?.length || 0);
        if (totalItems === 0) {
          console.log(`No emails or meetings found for user ${user.id}`);
          processedCount++;
          continue;
        }

        // 3. Send emails to OMI API
        let emailsSent = 0;
        for (const email of emails) {
          // Format email content for OMI
          const emailText = `
Subject: ${email.subject || "No Subject"}
From: ${email.sender || "Unknown Sender"}
Date: ${email.received_at ? new Date(email.received_at).toLocaleString() : "Unknown Date"}

${email.content || email.snippet || "No content"}
                    `.trim();

          // Fire and forget - don't wait for response
          sendToOmiAPI(user.omi_uid, emailText);
          console.log(
            `Sent email ${email.id} to OMI for user ${user.id} (fire and forget)`
          );
          emailsSent++;

          // Small delay to avoid overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // 4. Send meeting transcripts to OMI API
        let transcriptsSent = 0;
        if (meetings && meetings.length > 0) {
          for (const meeting of meetings) {
            try {
              if (meeting.transcript && meeting.transcript.startsWith("http")) {
                // Fetch transcript content from the URL
                const transcriptResponse = await fetch(meeting.transcript);
                if (transcriptResponse.ok) {
                  const transcriptContent = await transcriptResponse.text();

                  // Format transcript for OMI
                  const transcriptText = `
Meeting: ${meeting.meeting_title || "Untitled Meeting"}
Meeting ID: ${meeting.meeting_id}
Date: ${meeting.created_at ? new Date(meeting.created_at).toLocaleString() : "Unknown Date"}
Summary: ${meeting.summary || "No summary available"}

Transcript:
${transcriptContent}
                                    `.trim();

                  // Fire and forget - don't wait for response
                  sendToOmiAPI(user.omi_uid, transcriptText);
                  console.log(
                    `Sent transcript ${meeting.id} to OMI for user ${user.id} (fire and forget)`
                  );
                  transcriptsSent++;
                } else {
                  console.error(
                    `Failed to fetch transcript for meeting ${meeting.id}: ${transcriptResponse.status}`
                  );
                }
              }

              // Small delay to avoid overwhelming the API
              await new Promise((resolve) => setTimeout(resolve, 10));
            } catch (error) {
              console.error(
                `Error processing transcript for meeting ${meeting.id}:`,
                error
              );
            }
          }
        }

        console.log(
          `Successfully processed user ${user.id} - sent ${emailsSent}/${emails.length} emails and ${transcriptsSent}/${meetings?.length || 0} transcripts`
        );
        processedCount++;

        results.push({
          userId: user.id,
          email: user.email,
          emailsCount: emails.length,
          emailsSent: emailsSent,
          meetingsCount: meetings?.length || 0,
          transcriptsSent: transcriptsSent,
          status: "completed",
        });
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        errorCount++;

        results.push({
          userId: user.id,
          email: user.email,
          status: "error",
          error: error.message,
        });
      }
    }

    console.log(
      `OMI export cron job completed. Processed: ${processedCount}, Errors: ${errorCount}`
    );

    return NextResponse.json(
      {
        message: "OMI export completed",
        processed: processedCount,
        errors: errorCount,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in omi-export cron job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
