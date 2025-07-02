import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
// if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
//   throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

// export const supabaseAdminClient: SupabaseClient = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL as string,
//   process.env.SUPABASE_SERVICE_ROLE_KEY as string,
// );

export const supabaseAdminClient = (SUPABASE_SERVICE_ROLE_KEY: string) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    SUPABASE_SERVICE_ROLE_KEY,
  );
};
