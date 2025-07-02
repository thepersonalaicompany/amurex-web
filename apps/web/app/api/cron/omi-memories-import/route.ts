import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@amurex/supabase";

type User = {
  id: string;
  omi_uid: string;
  omi_connected: boolean;
};

type OmiMemory = {
  id: string;
  [key: string]: any;
};

type OmiMemoriesResponse = {
  memories: OmiMemory[];
  [key: string]: any;
};

type OmiMemoryInsert = {
  user_id: string;
  memories: OmiMemory;
  omi_memory_id: string;
  created_at: string;
};

type ResultSuccess = {
  user_id: string;
  status: "success";
  memories_count: number;
};

type ResultError = {
  user_id: string;
  status: "error";
  error: string;
};

type Result = ResultSuccess | ResultError;

const OMI_API_BASE_URL = "https://api.omi.me/v2";
const OMI_APP_ID = process.env.OMI_APP_ID as string;
const OMI_API_KEY = process.env.OMI_API_KEY as string;
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    // Verify cron secret to ensure this is called by the scheduler
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // initialize supabase admin client with service role key
    const supabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Fetch users with OMI user IDs
    const {
      data: users,
      error: usersError,
    }: { data: User[] | null; error: any | null } = await supabase
      .from("users")
      .select("id, omi_uid, omi_connected")
      .eq("omi_connected", true)
      .limit(50);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    const results: Result[] = [];

    if (!users) {
      return NextResponse.json({
        success: true,
        results,
      });
    }

    // Process each user
    for (const user of users) {
      try {
        // Fetch conversations from OMI API
        const response = await fetch(
          `${OMI_API_BASE_URL}/integrations/${OMI_APP_ID}/memories?uid=${user.omi_uid}`,
          {
            headers: {
              Authorization: `Bearer ${OMI_API_KEY}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`OMI API error: ${response.statusText}`);
        }

        const memoriesResp: OmiMemoriesResponse = await response.json();
        console.log(memoriesResp);

        const memoriesArr = Array.isArray(memoriesResp["memories"])
          ? memoriesResp["memories"]
          : [];

        for (const memory of memoriesArr) {
          const { error: insertError } = await supabase
            .from("omi_memories")
            .upsert(
              [
                {
                  user_id: user.id,
                  memories: memory,
                  omi_memory_id: memory["id"],
                  created_at: new Date().toISOString(),
                } as OmiMemoryInsert,
              ],
              {
                onConflict: "omi_memory_id",
                ignoreDuplicates: true,
              },
            );

          if (insertError) {
            console.error(`Error storing memories: ${insertError.message}`);
          } else {
            results.push({
              user_id: user.id,
              status: "success",
              memories_count: memoriesArr.length,
            });
          }
        }
      } catch (error: any) {
        results.push({
          user_id: user.id,
          status: "error",
          error: error?.message ?? String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error("OMI import error:", error);
    return NextResponse.json(
      { error: error?.message ?? String(error) },
      { status: 500 },
    );
  }
}
