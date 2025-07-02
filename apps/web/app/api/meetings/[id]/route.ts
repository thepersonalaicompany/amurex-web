import { supabaseAdminClient } from "@amurex/supabase";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const { id } = params;

    // initialize supabase admin client with service role key
    const supabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    const { data, error } = await supabase
      .from("late_meeting")
      .select(
        `
        id,
        meeting_id,
        meeting_title,
        created_at,
        summary,
        transcript,
        action_items
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data!);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
