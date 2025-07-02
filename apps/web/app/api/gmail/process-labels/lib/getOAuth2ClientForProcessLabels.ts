import { Auth } from "googleapis";
import { supabaseAdminClient } from "@amurex/supabase";
import { getOauth2Client } from "@amurex/web/lib";

interface UserData {
  google_cohort: number;
}

interface GoogleClientData {
  client_id: string;
  client_secret: string;
}

export const getOAuth2ClientForProcessLabels = async (
  userId: string,
): Promise<Auth.OAuth2Client> => {
  try {
    console.log("Getting OAuth credentials for user:", userId);

    // initialize supabase admin client with service role key
    const adminSupabase = supabaseAdminClient(
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    );

    // Fetch user's google_cohort
    const {
      data: userData,
      error: userError,
    }: { data: UserData | null; error: unknown | null } = await adminSupabase
      .from("users")
      .select("google_cohort")
      .eq("id", userId)
      .single();

    if (userError) throw userError;
    if (!userData) throw new Error("User not found");

    console.log("User cohort:", userData.google_cohort);

    // Fetch client credentials
    const {
      data: clientData,
      error: clientError,
    }: { data: GoogleClientData | null; error: unknown | null } =
      await adminSupabase
        .from("google_clients")
        .select("client_id, client_secret")
        .eq("id", userData.google_cohort)
        .single();

    if (clientError) throw clientError;
    if (!clientData) throw new Error("Client credentials not found");

    // Create OAuth2 client with validated credentials
    return getOauth2Client({ userData: clientData });
  } catch (error: unknown) {
    console.error("Error getting OAuth credentials:", error);

    // Fallback with proper environment variable validation
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Missing fallback Google OAuth credentials");
    }

    return getOauth2Client({});
  }
};
