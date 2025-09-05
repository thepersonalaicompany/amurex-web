import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OMI_API_BASE_URL = "https://api.omi.me/v2";
const OMI_APP_ID = process.env.OMI_APP_ID;
const OMI_API_KEY = process.env.OMI_API_KEY;

export async function GET(request) {
  try {
    // Verify cron secret to ensure this is called by the scheduler
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch users with OMI user IDs
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, omi_uid, omi_connected")
      .eq("omi_connected", true)
      .limit(50);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    const results = [];

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
          }
        );

        if (!response.ok) {
          throw new Error(`OMI API error: ${response.statusText}`);
        }

        const memories = await response.json();
        console.log(memories);

        for (const memory of memories["memories"]) {
          const { error: insertError } = await supabase
            .from("omi_memories")
            .upsert(
              {
                user_id: user.id,
                memories: memory,
                omi_memory_id: memory["id"],
                created_at: new Date().toISOString(),
              },
              {
                onConflict: "omi_memory_id",
                target: ["omi_memory_id"],
                ignoreDuplicates: true,
              }
            );

          if (insertError) {
            console.error(`Error storing memories: ${insertError.message}`);
          } else {
            results.push({
              user_id: user.id,
              status: "success",
              memories_count: memories.length,
            });
          }
        }
      } catch (error) {
        results.push({
          user_id: user.id,
          status: "error",
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("OMI import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
