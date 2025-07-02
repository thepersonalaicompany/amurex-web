"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@amurex/supabase";
import { useSearchParams } from "next/navigation";

interface NotionResponse {
  success: boolean;
  error?: string;
  access_token?: string;
  workspace_id?: string;
  bot_id?: string;
}

interface UpdateResponse {
  success: boolean;
  error?: string;
}

interface ImportResponse {
  success: boolean;
  error?: string;
}

// Component that uses useSearchParams
export const NotionCallbackContent = (): JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleNotionCallback = async (): Promise<void> => {
      const code: string | null = searchParams.get("code");
      const state: string | null = searchParams.get("state");

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

        const userId: string = session.user.id;

        console.log(`Making API call to exchange code for token`);
        const response: Response = await fetch(
          `/api/notion/callback?code=${code}&state=${state}`,
        );
        const data: NotionResponse = await response.json();

        if (!data.success) {
          console.error("Error connecting Notion:", data.error);
          router.push(
            `/settings?error=${encodeURIComponent(data.error || "Unknown error")}`,
          );
          return;
        }

        console.log("Notion API response:", data);
        const { access_token, workspace_id, bot_id } = data;

        // Update user with Notion credentials
        const updateResponse: Response = await fetch("/api/notion/callback", {
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

        const updateData: UpdateResponse = await updateResponse.json();
        if (!updateData.success) {
          console.error("Error updating user:", updateData.error);
          router.push(
            `/settings?error=${encodeURIComponent(updateData.error || "Unknown error")}`,
          );
          return;
        }

        console.log("Notion connected successfully");

        // Clear the URL parameters
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );

        // Check if we're coming from onboarding
        const source: string = state || "settings";

        // Trigger Notion import in the background
        fetch("/api/notion/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session.user.email && { "x-user-email": session.user.email }),
          },
          body: JSON.stringify({
            session: session,
            runInBackground: true,
          }),
        })
          .then((response: Response) => response.json())
          .then((data: ImportResponse) => {
            if (data.success) {
              console.log("Notion import started in background");
            } else {
              console.error("Failed to start Notion import:", data.error);
            }
          })
          .catch((err: Error) => {
            console.error("Error starting Notion import:", err);
          });

        // Redirect based on source
        if (source === "onboarding") {
          router.push("/onboarding?connection=success");
        } else {
          router.push("/settings?connection=success");
        }
      } catch (error: unknown) {
        console.error("Error handling Notion callback:", error);
        router.push("/settings?error=Failed to connect Notion");
      }
    };

    handleNotionCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-white">
          Connecting Notion
        </h1>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">
          Please wait while we connect your Notion account...
        </p>
      </div>
    </div>
  );
};
