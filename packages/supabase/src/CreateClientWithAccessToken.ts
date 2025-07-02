import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");

export const CreateClientWithAccessToken = (
  accessToken: string,
  SUPABASE_SERVICE_ROLE_KEY: string,
) => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  );
};
