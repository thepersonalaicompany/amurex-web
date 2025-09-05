"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// Component that uses useSearchParams
function NotionCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleNotionCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");

      if (!code) return;

      try {
        console.log("Code:", code);

        // Get user session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("No active session");
        }

        const userId = session.user.id;

        console.log(`Making API call to exchange code for token`);
        const response = await fetch(
          `/api/notion/callback?code=${code}&state=${state}`
        );
        const data = await response.json();

        if (!data.success) {
          console.error("Error connecting Notion:", data.error);
          router.push(`/settings?error=${encodeURIComponent(data.error)}`);
          return;
        }

        console.log("Notion API response:", data);
        const { access_token, workspace_id, bot_id } = data;

        // Update user with Notion credentials
        const updateResponse = await fetch("/api/notion/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token,
            workspace_id,
            bot_id,
            state,
            userId,
          }),
        });

        const updateData = await updateResponse.json();
        if (!updateData.success) {
          console.error("Error updating user:", updateData.error);
          router.push(
            `/settings?error=${encodeURIComponent(updateData.error)}`
          );
          return;
        }

        console.log("Notion connected successfully");

        // Clear the URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // Check if we're coming from onboarding
        const source = state || "settings";

        // Trigger Notion import in the background
        fetch("/api/notion/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": session.user.email,
          },
          body: JSON.stringify({
            session: session,
            runInBackground: true,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              console.log("Notion import started in background");
            } else {
              console.error("Failed to start Notion import:", data.error);
            }
          })
          .catch((err) => {
            console.error("Error starting Notion import:", err);
          });

        // Redirect based on source
        if (source === "onboarding") {
          router.push("/onboarding?connection=success");
        } else {
          router.push("/settings?connection=success");
        }
      } catch (error) {
        console.error("Error handling Notion callback:", error);
        router.push("/settings?error=Failed to connect Notion");
      }
    };

    handleNotionCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold text-white">
          Connecting Notion
        </h1>
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
        <p className="mt-4 text-gray-400">
          Please wait while we connect your Notion account...
        </p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function NotionCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold text-white">Loading...</h1>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-purple-500"></div>
          </div>
        </div>
      }
    >
      <NotionCallbackContent />
    </Suspense>
  );
}
