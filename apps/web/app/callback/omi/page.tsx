"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@amurex/supabase";

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
        } = await supabase.auth.getSession();
        console.log("Session data:", session);

        if (!session?.user?.id) {
          console.error("Unauthorized: No user session found.");
          router.push("/signin"); // Redirect to sign-in if not authenticated
          return;
        }

        // Get the URL parameters
        const omi_uid = searchParams.get("uid");

        if (!omi_uid) {
          console.error("Missing OMI user ID in callback.");
          router.push("/settings?error=omi_uid_missing"); // Redirect with error
          return;
        }

        // Update the user in Supabase
        const { error } = await supabase
          .from("users")
          .update({
            omi_connected: true,
            omi_uid: omi_uid,
          })
          .eq("id", session.user.id)
          .select();

        if (error) {
          console.error("Error updating user:", error);
          router.push(`/settings?error=${encodeURIComponent(error.message)}`);
          return;
        }

        console.log("User OMI connection updated successfully");

        // Trigger initial export of user's data to OMI
        try {
          console.log("Triggering initial OMI export...");
          const response = await fetch("/api/omi/trigger-initial-export", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: session.user.id,
            }),
          });

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

        router.push("/settings?omi_connected=true");
      } catch (error: unknown) {
        console.error("Error in OMI route:", error);
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        router.push(`/settings?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    handleOmiCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Connecting to Omi...</h1>
        <p className="text-gray-400">
          Please wait, you will be redirected shortly.
        </p>
      </div>
    </div>
  );
}

export default function OmiCallbackPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      }
    >
      <OmiCallback />
    </Suspense>
  );
}
