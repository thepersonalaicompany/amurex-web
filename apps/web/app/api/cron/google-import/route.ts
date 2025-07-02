import { NextResponse } from "next/server";
import { validateGoogleAccess } from "./lib";
import { supabaseAdminClient } from "@amurex/supabase";
import { GoogleClient, ProcessResult, UserClientData } from "./types";

// Vercel Cron configuration
export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  try {
    // Authorization check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // initialize supabase admin client with service role key
    const supabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Fetch users with Google credentials
    const { data: users, error } = await supabase
      .from("users")
      .select("id, google_refresh_token, google_cohort")
      .not("google_refresh_token", "is", null)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch users: ${error.message}`);
    if (!users?.length) {
      return NextResponse.json({
        success: true,
        message: "No users with Google credentials found",
        processedUsers: 0,
        results: [],
      });
    }

    // Process client credentials
    const cohortIds = Array.from(
      new Set(
        users
          .map((user) => user.google_cohort)
          .filter((id): id is string => !!id),
      ),
    );

    const { data: clientsData, error: clientsError } = await supabase
      .from("google_clients")
      .select("id, client_id, client_secret")
      .in("id", cohortIds.length > 0 ? cohortIds : ["dummy-id"]);

    if (clientsError)
      throw new Error(`Failed to fetch clients: ${clientsError.message}`);

    const clientsMap: Record<string, GoogleClient> = clientsData.reduce(
      (acc, client) => ({
        ...acc,
        [client.id]: client,
      }),
      {},
    );

    const userClientMap: Record<string, UserClientData> = users.reduce(
      (acc, user) => {
        if (user.google_cohort && clientsMap[user.google_cohort]) {
          acc[user.id] = {
            client_id: clientsMap[user.google_cohort]!.client_id,
            client_secret: clientsMap[user.google_cohort]!.client_secret,
            refresh_token: user.google_refresh_token!,
          };
        }
        return acc;
      },
      {} as Record<string, UserClientData>,
    );

    // Process users
    const results: ProcessResult[] = [];
    let skipCount = 0;

    for (const user of users) {
      try {
        console.log(`Processing user ${user.id}`);

        if (!userClientMap[user.id]) {
          const result = {
            userId: user.id,
            success: false,
            error: "Client credentials not found",
            skipped: true,
          };
          results.push(result);
          skipCount++;
          continue;
        }

        const validation = await validateGoogleAccess(
          user.id,
          user.google_refresh_token!,
          userClientMap,
        );

        if (!validation.valid) {
          results.push({
            userId: user.id,
            success: false,
            error: validation.message,
            reason: validation.reason,
            skipped: true,
          });
          skipCount++;
          continue;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/google/import?userId=${user.id}`,
          { method: "GET" },
        );

        const result = await response.json();
        results.push({
          userId: user.id,
          success: result.success,
          documentsCount: result.documents?.length || 0,
        });
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        results.push({
          userId: user.id,
          success: false,
          error: message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedUsers: results.length - skipCount,
      skippedUsers: skipCount,
      totalUsers: results.length,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
