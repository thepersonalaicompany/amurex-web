import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@amurex/supabase";
import { EmailPreferences, PostRequestBody, UserRow } from "./types";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    // initialize supabase admin client with service role key
    const supabaseAdmin = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    const { userId, categories } = (await req.json()) as PostRequestBody;

    if (!userId || !categories) {
      return NextResponse.json(
        { success: false, error: "User ID and categories are required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({
        email_categories: categories,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating email preferences:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update email preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email preferences updated successfully",
    });
  } catch (error) {
    console.error("Error in email preferences update:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    // initialize supabase admin client with service role key
    const supabaseAdmin = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("email_categories")
      .eq("id", userId)
      .single<UserRow>();

    if (error) {
      console.error("Error fetching email preferences:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch email preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      categories: data?.email_categories || getDefaultCategories(),
    });
  } catch (error) {
    console.error("Error in email preferences fetch:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

function getDefaultCategories(): EmailPreferences {
  return {
    categories: {
      to_respond: true,
      fyi: true,
      comment: true,
      notification: true,
      meeting_update: true,
      awaiting_reply: true,
      actioned: true,
    },
    custom_properties: {},
  };
}
