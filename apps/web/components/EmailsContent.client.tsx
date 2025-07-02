"use client";

import { useEmailsPageStore } from "@amurex/ui/store";
import { useEffect } from "react";
import { toast } from "sonner";

export const EmailsContentClient = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { fetchUserId, userId, fetchGmailCredentials } = useEmailsPageStore();
  useEffect(() => {
    fetchUserId();
  }, []);

  // Check for OAuth success and show toast
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connection = urlParams.get("connection");
    const source = urlParams.get("source");

    if (connection === "success" && source === "google") {
      toast.success("Gmail account connected successfully!");
      // Clean up the URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Refetch Gmail accounts to update the UI
      if (userId) {
        fetchGmailCredentials(userId);
      }
    }
  }, [userId]);
  return <>{children}</>;
};
