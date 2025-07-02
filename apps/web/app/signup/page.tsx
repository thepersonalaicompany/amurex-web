"use client";

import { supabase } from "@amurex/supabase";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

interface User {
  id: string;
  omi_connected: boolean;
  omi_uid: string | null;
}

interface Session {
  user: {
    id: string;
  } | null;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: {
    message: string;
  } | null;
}

interface ApiResponse {
  success: boolean;
  error?: string;
}

function OmiCallback(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleOmiCallback = async (): Promise<void> => {
      try {
        // Get the authenticated user
        console.log("Getting authenticated user");
        const {
          data: { session },
        }: { data: { session: Session | null } } =
          await supabase.auth.getSession();
        console.log("Session data:", session);

        if (!session?.user?.id) {
          console.error("Unauthorized access");
          return;
        }

        // Get the URL parameters
        const omi_uid: string | null = searchParams.get("uid");

        if (!omi_uid) {
          console.error("Missing OMI user ID");
          return;
        }

        // Update the user in Supabase
        const { data, error }: SupabaseResponse<User[]> = await supabase
          .from("users")
          .update({
            omi_connected: true,
            omi_uid: omi_uid,
          })
          .eq("id", session.user.id)
          .select();

        if (error) {
          console.error("Error updating user:", error);
          return;
        }

        console.log("User OMI connection updated successfully");

        // Trigger initial export of user's data to OMI
        try {
          console.log("Triggering initial OMI export...");
          const response: Response = await fetch(
            "/api/omi/trigger-initial-export",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: session.user.id,
              }),
            },
          );

          if (response.ok) {
            console.log("Initial OMI export triggered successfully");
          } else {
            console.error(
              "Failed to trigger initial OMI export:",
              response.status,
            );
          }
        } catch (exportError: unknown) {
          console.error("Error triggering initial OMI export:", exportError);
          // Don't fail the callback flow if export fails
        }

        router.push("/settings");
      } catch (error: unknown) {
        console.error("Error in OMI route:", error);
        return;
      }
    };

    handleOmiCallback();
  }, [router, searchParams]);

  return (
    <div>
      <h1>Omi Callback</h1>
    </div>
  );
}

export default function OmiCallbackPage(): JSX.Element {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OmiCallback />
    </Suspense>
  );
}
