"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@amurex/supabase";

interface GoogleCalendarResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  error?: string;
}

interface UpdateResponse {
  success: boolean;
  error?: string;
}

export default function GoogleCalendarCallbackPage(): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const handleGoogleCalendarCallback = async (): Promise<void> => {
      const urlParams = new URLSearchParams(window.location.search);
      const code: string | null = urlParams.get("code");
      const state: string | null = urlParams.get("state");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // TODO?: Added null check
      if (!session) {
        console.error("No active session found");
        router.push("/login");
        return;
      }

      const userId: string = session.user.id;

      if (code) {
        try {
          const response: Response = await fetch(
            `/api/google/calendar/callback?code=${code}&state=${state}`,
          );
          const data: GoogleCalendarResponse = await response.json();

          if (data.success) {
            const { access_token, refresh_token } = data;

            const updateResponse: Response = await fetch(
              "/api/google/calendar/callback",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  access_token,
                  refresh_token,
                  state,
                  userId,
                }),
              },
            );

            const updateData: UpdateResponse = await updateResponse.json();
            if (updateData.success) {
              console.log("Google Calendar connected successfully");
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname,
              );
              router.push("/settings");
            } else {
              console.error("Error updating user:", updateData.error);
            }
          } else {
            console.error("Error connecting Google Calendar:", data.error);
          }
        } catch (error: unknown) {
          console.error("Error handling Google Calendar callback:", error);
        }
      }
    };

    handleGoogleCalendarCallback();
  }, [router]);

  return (
    <div>
      <h1>Connecting to Google Calendar...</h1>
    </div>
  );
}
