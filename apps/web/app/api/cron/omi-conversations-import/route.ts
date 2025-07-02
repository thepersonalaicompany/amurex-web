import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@amurex/supabase";

type User = {
  id: string;
  omi_uid: string;
  omi_connected: boolean;
};

type OMIConversation = {
  id: string;
  [key: string]: any;
};

type OMIConversationsResponse = {
  conversations: OMIConversation[];
  [key: string]: any;
};

type ResultSuccess = {
  user_id: string;
  status: "success";
  conversations_count: number;
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

// dynamic is added because the use of request.headers caused Dynamic Server Error
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

    console.log("This is the users", users);

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    const results: Result[] = [];

    // Process each user
    for (const user of users ?? []) {
      try {
        // Fetch conversations from OMI API
        const response = await fetch(
          `${OMI_API_BASE_URL}/integrations/${OMI_APP_ID}/conversations?uid=${user.omi_uid}`,
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

        const conversations: OMIConversationsResponse = await response.json();
        console.log(conversations);

        // Store conversations in database

        for (const conversation of conversations["conversations"] ?? []) {
          const { error: insertError }: { error: any | null } = await supabase
            .from("omi_conversations")
            .upsert(
              {
                user_id: user.id,
                omi_conversation_id: conversation["id"],
                conversations: conversation,
                created_at: new Date().toISOString(),
              },
              {
                onConflict: "omi_conversation_id",
                // target: ["omi_conversation_id"],         TODO?: upsert method from Supabase does not accept a target property in its options object
                ignoreDuplicates: true,
              },
            );

          if (insertError) {
            throw new Error(
              `Error storing conversations: ${insertError.message}`,
            );
          }
        }

        results.push({
          user_id: user.id,
          status: "success",
          conversations_count: (conversations["conversations"] ?? []).length,
        });
      } catch (error: any) {
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
  } catch (error: any) {
    console.error("OMI import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
