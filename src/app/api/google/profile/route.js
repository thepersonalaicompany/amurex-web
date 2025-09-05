import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(req) {
  try {
    // Get user ID from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get all connected Gmail addresses for the user
    const { data: gmailAccounts, error: gmailError } = await supabase
      .from("user_gmails")
      .select("email_address, type")
      .eq("user_id", userId);

    if (gmailError) {
      return NextResponse.json(
        { success: false, error: "Error fetching Gmail accounts" },
        { status: 400 }
      );
    }

    if (!gmailAccounts || gmailAccounts.length === 0) {
      return NextResponse.json(
        { success: false, error: "No Gmail accounts found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      emails: gmailAccounts.map((account) => ({
        email: account.email_address,
        type: account.type,
      })),
    });
  } catch (error) {
    console.error("Error fetching Gmail accounts:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
