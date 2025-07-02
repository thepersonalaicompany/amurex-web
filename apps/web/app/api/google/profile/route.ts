import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@amurex/supabase";

type UserGmail = {
  email_address: string;
  type: string;
};

type GmailResponseSuccess = {
  success: true;
  emails: { email: string; type: string }[];
};

type GmailResponseError = {
  success: false;
  error: string;
};

// dynamic is used because the use of req.url and req.headers caused Dynamic Server Error
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  try {
    // Get user ID from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" } as GmailResponseError,
        { status: 400 },
      );
    }

    // initialize supabase admin client with service role key
    const supabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Get all connected Gmail addresses for the user
    const {
      data: gmailAccounts,
      error: gmailError,
    }: { data: UserGmail[] | null; error: any } = await supabase
      .from("user_gmails")
      .select("email_address, type")
      .eq("user_id", userId);

    if (gmailError) {
      return NextResponse.json(
        {
          success: false,
          error: "Error fetching Gmail accounts",
        } as GmailResponseError,
        { status: 400 },
      );
    }

    if (!gmailAccounts || gmailAccounts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No Gmail accounts found",
        } as GmailResponseError,
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      emails: gmailAccounts.map((account: UserGmail) => ({
        email: account.email_address,
        type: account.type,
      })),
    } as GmailResponseSuccess);
  } catch (error: any) {
    console.error("Error fetching Gmail accounts:", error);
    return NextResponse.json(
      { success: false, error: error.message } as GmailResponseError,
      { status: 500 },
    );
  }
}
