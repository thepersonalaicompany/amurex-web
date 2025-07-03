"use server";

import { createClient } from "@supabase/supabase-js";

export const DeleteAccountAction = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  // Create admin Supabase client globally
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("Missing environment variables");
  }

  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Delete from user_gmails
    await adminSupabase.from("user_gmails").delete().eq("user_id", userId);

    // 2. Delete from documents
    await adminSupabase.from("documents").delete().eq("user_id", userId);

    // 3. Delete from threads
    await adminSupabase.from("threads").delete().eq("user_id", userId);

    // 4. Delete from late_meeting (if user_id or user_ids)
    await adminSupabase.from("late_meeting").delete().eq("user_id", userId); // TODO: If user_ids is an array, you may need a custom RPC or filter

    // 5. Delete from users
    await adminSupabase.from("users").delete().eq("id", userId);

    // 6. Delete from Supabase Auth
    await adminSupabase.auth.admin.deleteUser(userId);

    console.log("from delete account action");
  } catch (error) {
    console.error(
      `Error deleting account:${userId} from Supabase:${error.message}`
    );
    throw new Error("Failed to delete account");
  }
};
