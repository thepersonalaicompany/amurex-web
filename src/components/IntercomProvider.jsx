"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Intercom from "@intercom/messenger-js-sdk";

// Intercom App ID
const INTERCOM_APP_ID = "dd9ig52g";

export default function IntercomProvider({ children }) {
  useEffect(() => {
    if (!INTERCOM_APP_ID) {
      console.warn(
        "Intercom App ID not provided. Intercom chat will not be available."
      );
      return;
    }

    // Get user information if they're logged in
    const initializeIntercom = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          // Initialize Intercom with user data if available
          if (userData) {
            Intercom({
              app_id: INTERCOM_APP_ID,
              user_id: session.user.id,
              email: session.user.email,
              name: userData.full_name || session.user.email,
              created_at: Math.floor(
                new Date(session.user.created_at).getTime() / 1000
              ), // Unix timestamp in seconds
            });
          } else {
            // Initialize with basic session info
            Intercom({
              app_id: INTERCOM_APP_ID,
              user_id: session.user.id,
              email: session.user.email,
              created_at: Math.floor(
                new Date(session.user.created_at).getTime() / 1000
              ), // Unix timestamp in seconds
            });
          }
        } else {
          // Initialize Intercom without user data (anonymous)
          Intercom({
            app_id: INTERCOM_APP_ID,
          });
        }
      } catch (error) {
        console.error("Error setting up Intercom:", error);
        // Initialize Intercom without user data as fallback
        Intercom({
          app_id: INTERCOM_APP_ID,
        });
      }
    };

    // Initialize Intercom
    initializeIntercom();

    // Clean up on unmount
    return () => {
      // Shutdown is handled differently in the new SDK
      if (window.Intercom) {
        window.Intercom("shutdown");
      }
    };
  }, []);

  return children;
}
