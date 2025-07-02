import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateGmailAccess } from "./lib";
import { supabaseAdminClient } from "@amurex/supabase";
import { GoogleClient, ProcessResult, User, UserClientConfig } from "./types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const revalidate = 0;
export const runtime = "nodejs";

// TODO?: This does not work with NextJS13+ and throws error, just need to specify this in vercel.json
// Vercel Cron configuration - updated to run every hour
// export const schedule = "*/15 * * * *"; // Cron syntax: every 15 minutes

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // initialize supabase admin client with service role key
    const supabaseAdmin = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    const { data: users, error: usersError } = (await supabaseAdmin
      .from("users")
      .select(
        "id, email_tagging_enabled, google_refresh_token, google_cohort, created_at",
      )
      .eq("email_tagging_enabled", true)
      .not("google_refresh_token", "is", null)
      .order("created_at", { ascending: false })) as {
      data: User[] | null;
      error: any;
    };

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        {
          success: false,
          error: "Error fetching users",
        },
        { status: 500 },
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users with email tagging enabled",
      });
    }

    console.log(`Processing emails for ${users.length} users via cron job`);

    const cohortIds = [
      ...new Set(users.map((user) => user.google_cohort)),
    ].filter((id): id is string => id !== null);

    const { data: clientsData, error: clientsError } = (await supabaseAdmin
      .from("google_clients")
      .select("id, client_id, client_secret")
      .in("id", cohortIds.length > 0 ? cohortIds : ["dummy"])) as {
      data: GoogleClient[] | null;
      error: any;
    };

    if (clientsError) {
      console.error("Error fetching client credentials:", clientsError);
      return NextResponse.json(
        {
          success: false,
          error: "Error fetching client credentials",
        },
        { status: 500 },
      );
    }

    const clientsMap =
      clientsData?.reduce((acc: Record<string, GoogleClient>, client) => {
        acc[client.id] = client;
        return acc;
      }, {}) ?? {};

    const userClientMap = users.reduce(
      (acc: Record<string, UserClientConfig>, user) => {
        const client = clientsMap[user.google_cohort || ""];
        if (client) {
          acc[user.id] = {
            client_id: client.client_id,
            client_secret: client.client_secret,
            refresh_token: user.google_refresh_token,
          };
        }
        return acc;
      },
      {},
    );

    const results: ProcessResult[] = [];

    for (const user of users) {
      try {
        const userId = user.id;

        if (!userClientMap[userId]) {
          console.log(`Skipping user ${userId} - client credentials not found`);
          results.push({
            userId,
            success: false,
            error: "Client credentials not found",
            reason: "configuration_error",
          });
          continue;
        }

        const validation = await validateGmailAccess(
          userId,
          user.google_refresh_token,
          userClientMap,
        );

        if (!validation.valid) {
          console.log(
            `Skipping user ${userId} - invalid token: ${validation.reason}`,
          );
          results.push({
            userId,
            success: false,
            error: validation.message || "Token validation failed",
            reason: validation.reason,
          });
          continue;
        }

        console.log(
          `Token validated for user ${userId}, proceeding to process emails`,
        );

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/process-labels`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: userId,
              useGroq: true,
              maxEmails: 2,
            }),
          },
        );

        const responseData = await response.json();

        if (response.ok) {
          results.push({
            userId,
            processed: responseData.processed || 0,
            total_stored: responseData.total_stored || 0,
            message: responseData.message || "Processed successfully",
            success: true,
          });
        } else {
          results.push({
            userId,
            error: responseData.error || "Unknown error",
            success: false,
          });
        }
      } catch (userError) {
        console.error(
          `Error processing emails for user ${user.id}:`,
          userError,
        );
        const message =
          userError instanceof Error ? userError.message : "Unknown error";
        results.push({
          userId: user.id,
          error: message,
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cron job completed",
      results,
    });
  } catch (error) {
    console.error("Error in cron job:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: "Error in cron job: " + message,
      },
      { status: 500 },
    );
  }
}
