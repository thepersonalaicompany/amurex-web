import { supabaseAdminClient } from "@amurex/supabase";

// 3. Send payload to Supabase table
export const sendPayload = async (
  content: any,
  user_id: string,
): Promise<void> => {
  // initialize supabase admin client with service role key
  const adminSupabase = supabaseAdminClient(
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );
  await adminSupabase
    .from("message_history")
    .insert([
      {
        payload: content,
        user_id: user_id,
      },
    ])
    .select("id");
};
