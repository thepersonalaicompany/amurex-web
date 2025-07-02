import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@amurex/supabase";

type User = {
  id: string;
  email: string;
  omi_connected: boolean;
  omi_uid: string;
};

type Email = {
  id: string;
  subject?: string | null;
  content?: string | null;
  sender?: string | null;
  received_at?: string | null;
  snippet?: string | null;
};

type Meeting = {
  id: string;
  meeting_id: string;
  transcript?: string | null;
  summary?: string | null;
  meeting_title?: string | null;
  meeting_start_time?: string | null;
  created_at?: string | null;
  user_ids?: string[];
};

type CronResultItem =
  | {
      userId: string;
      email: string;
      emailsCount: number;
      emailsSent: number;
      meetingsCount: number;
      transcriptsSent: number;
      status: "completed";
    }
  | {
      userId: string;
      email: string;
      status: "error";
      error: string;
    };

type CronResult = {
  message: string;
  processed: number;
  errors: number;
  results: CronResultItem[];
};

type NoUsersResult = {
  message: string;
  processed: number;
  errors: number;
  results: [];
};

// Import the cron function directly
async function runOmiExportCron(
  isInitial: boolean = false,
  specificUserId: string | null = null,
): Promise<CronResult | NoUsersResult> {
  try {
    console.log("Starting OMI export cron job...");

    // Get the 'initial' parameter
    console.log(`Running in ${isInitial ? "initial" : "incremental"} mode`);

    // initialize supabase admin client with service role key
    const supabaseAdmin = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // 1. Get users with OMI connection data
    let query = supabaseAdmin
      .from("users")
      .select("id, email, omi_connected, omi_uid")
      .eq("omi_connected", true)
      .not("omi_uid", "is", null);

    // If specificUserId is provided, filter for that user only
    if (specificUserId) {
      query = query.eq("id", specificUserId);
    }

    const {
      data: users,
      error: usersError,
    }: { data: User[] | null; error: any } = await query;

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw new Error("Error fetching users");
    }

    if (!users || users.length === 0) {
      console.log("No users with OMI connection found");
      return {
        message: "No users to process",
        processed: 0,
        errors: 0,
        results: [],
      };
    }

    console.log(`Found ${users.length} users to process`);

    const results: CronResultItem[] = [];
    let processedCount = 0;
    let errorCount = 0;

    // Helper function to send to OMI API
    const sendToOmiAPI = (omiUid: string, text: string): void => {
      const url = `https://api.omi.me/v2/integrations/01JWF84YVZ6SYKE486KWARA2CK/user/memories?uid=${omiUid}&limit=100&offset=0`;

      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OMI_API_KEY as string}`,
        },
        body: JSON.stringify({
          text: text,
          text_source: "email",
        }),
      }).catch((error: any) => {
        console.error("Error sending to OMI API (fire and forget):", error);
      });
    };

    // 2. Process each user
    for (const user of users) {
      try {
        console.log(`Processing user ${user.id} (${user.email})`);

        // Get emails for this user
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        let emailsQuery = supabaseAdmin
          .from("emails")
          .select("id, subject, content, sender, received_at, snippet")
          .eq("user_id", user.id);

        if (!isInitial) {
          emailsQuery = emailsQuery.gte("received_at", oneHourAgo);
        } else {
          emailsQuery = emailsQuery.limit(50);
        }

        emailsQuery = emailsQuery.order("received_at", { ascending: false });

        const {
          data: emails,
          error: emailsError,
        }: { data: Email[] | null; error: any } = await emailsQuery;

        if (emailsError) {
          console.error(
            `Error fetching emails for user ${user.id}:`,
            emailsError,
          );
          errorCount++;
          continue;
        }

        console.log(`Found ${emails?.length || 0} emails for user ${user.id}`);

        // Also get meeting transcripts for this user
        let meetingsQuery = supabaseAdmin
          .from("late_meeting")
          .select(
            "id, meeting_id, transcript, summary, meeting_title, meeting_start_time, created_at, user_ids",
          )
          .contains("user_ids", [user.id]);

        if (!isInitial) {
          meetingsQuery = meetingsQuery.gte("created_at", oneHourAgo);
        } else {
          meetingsQuery = meetingsQuery.limit(50);
        }

        meetingsQuery = meetingsQuery.order("created_at", { ascending: false });

        const {
          data: meetings,
          error: meetingsError,
        }: { data: Meeting[] | null; error: any } = await meetingsQuery;

        if (meetingsError) {
          console.error(
            `Error fetching meetings for user ${user.id}:`,
            meetingsError,
          );
        } else {
          console.log(
            `Found ${meetings?.length || 0} meetings for user ${user.id}`,
          );
        }

        const totalItems = (emails?.length || 0) + (meetings?.length || 0);
        if (totalItems === 0) {
          console.log(`No emails or meetings found for user ${user.id}`);
          processedCount++;
          continue;
        }

        // 3. Send emails to OMI API
        let emailsSent = 0;
        if (emails && emails.length > 0) {
          for (const email of emails) {
            const emailText = `
Subject: ${email.subject || "No Subject"}
From: ${email.sender || "Unknown Sender"}
Date: ${email.received_at ? new Date(email.received_at).toLocaleString() : "Unknown Date"}

${email.content || email.snippet || "No content"}
            `.trim();

            sendToOmiAPI(user.omi_uid, emailText);
            console.log(
              `Sent email ${email.id} to OMI for user ${user.id} (fire and forget)`,
            );
            emailsSent++;

            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }

        // 4. Send meeting transcripts to OMI API
        let transcriptsSent = 0;
        if (meetings && meetings.length > 0) {
          for (const meeting of meetings) {
            try {
              if (meeting.transcript && meeting.transcript.startsWith("http")) {
                const transcriptResponse = await fetch(meeting.transcript);
                if (transcriptResponse.ok) {
                  const transcriptContent = await transcriptResponse.text();

                  const transcriptText = `
Meeting: ${meeting.meeting_title || "Untitled Meeting"}
Meeting ID: ${meeting.meeting_id}
Date: ${meeting.created_at ? new Date(meeting.created_at).toLocaleString() : "Unknown Date"}
Summary: ${meeting.summary || "No summary available"}

Transcript:
${transcriptContent}
                  `.trim();

                  sendToOmiAPI(user.omi_uid, transcriptText);
                  console.log(
                    `Sent transcript ${meeting.id} to OMI for user ${user.id} (fire and forget)`,
                  );
                  transcriptsSent++;
                } else {
                  console.error(
                    `Failed to fetch transcript for meeting ${meeting.id}: ${transcriptResponse.status}`,
                  );
                }
              }

              await new Promise((resolve) => setTimeout(resolve, 10));
            } catch (error: any) {
              console.error(
                `Error processing transcript for meeting ${meeting.id}:`,
                error,
              );
            }
          }
        }

        console.log(
          `Successfully processed user ${user.id} - sent ${emailsSent}/${emails?.length || 0} emails and ${transcriptsSent}/${meetings?.length || 0} transcripts`,
        );
        processedCount++;

        results.push({
          userId: user.id,
          email: user.email,
          emailsCount: emails?.length || 0,
          emailsSent: emailsSent,
          meetingsCount: meetings?.length || 0,
          transcriptsSent: transcriptsSent,
          status: "completed",
        });
      } catch (error: any) {
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
      `OMI export cron job completed. Processed: ${processedCount}, Errors: ${errorCount}`,
    );

    return {
      message: "OMI export completed",
      processed: processedCount,
      errors: errorCount,
      results,
    };
  } catch (error: any) {
    console.error("Error in omi-export cron job:", error);
    throw error;
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body: { userId?: string } = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 },
      );
    }

    // initialize supabase admin client with service role key
    const supabaseAdmin = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Verify the user exists and has OMI connected
    const { data: user, error: userError }: { data: User | null; error: any } =
      await supabaseAdmin
        .from("users")
        .select("id, email, omi_connected, omi_uid")
        .eq("id", userId)
        .eq("omi_connected", true)
        .not("omi_uid", "is", null)
        .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found or OMI not connected",
        },
        { status: 404 },
      );
    }

    // Call the cron function directly with initial=true
    const cronResult = await runOmiExportCron(true, userId);
    console.log("Initial export triggered successfully for user:", userId);

    return NextResponse.json({
      success: true,
      message: "Initial export triggered successfully",
      result: cronResult,
    });
  } catch (error: any) {
    console.error("Error triggering initial export:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
