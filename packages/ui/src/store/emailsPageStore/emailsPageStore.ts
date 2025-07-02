"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { supabase } from "@amurex/supabase";
import {
  EmailCategoriesType,
  EmailsPageStoreType,
  SampleEmailType,
} from "./types";

export const useEmailsPageStore = create<EmailsPageStoreType>((set, get) => ({
  sampleEmails: [
    {
      id: 1,
      sender: "Product Team",
      subject: "Need your feedback on this proposal",
      category: "to_respond",
      time: "10:30 AM",
    },
    {
      id: 2,
      sender: "Sanskar Jethi",
      subject: "Boring stakeholder meeting on ROI strategy for Q3",
      category: "fyi",
      time: "Yesterday",
    },
    {
      id: 3,
      sender: "Arsen Kylyshbek",
      subject: "just launched a feature - let's f*cking go!",
      category: "comment",
      time: "Yesterday",
    },
    {
      id: 4,
      sender: "GitHub",
      subject: "Security alert for your repository",
      category: "notification",
      time: "Sep 14",
    },
    {
      id: 5,
      sender: "Zoom",
      subject: "Your meeting with Design Team has been scheduled",
      category: "meeting_update",
      time: "Sep 14",
    },
    {
      id: 6,
      sender: "Alice Bentinck",
      subject: "Re: Invitation - IC",
      category: "awaiting_reply",
      time: "Sep 13",
    },
    {
      id: 7,
      sender: "Marketing",
      subject: "Content calendar approved",
      category: "actioned",
      time: "Sep 12",
    },
  ],
  filteredEmails: () => {
    const { sampleEmails, categories } = get();
    return sampleEmails.filter(
      (email: SampleEmailType) =>
        categories[email.category as keyof EmailCategoriesType],
    );
  },
  userId: null,
  setUserId: (userId) => set({ userId }),

  isProcessingEmails: false,
  setIsProcessingEmails: (value) => set({ isProcessingEmails: value }),

  emailTaggingEnabled: false,
  setEmailTaggingEnabled: (value) => set({ emailTaggingEnabled: value }),

  hasEmailRecord: false,
  setHasEmailRecord: (value) => set({ hasEmailRecord: value }),

  emailAddress: null,
  setEmailAddress: (emailAddress) => set({ emailAddress }),

  refreshToken: null,
  setRefreshToken: (refreshToken) => set({ refreshToken }),

  googleClientId: null,
  setGoogleClientId: (googleClientId) => set({ googleClientId }),

  googleClientSecret: null,
  setGoogleClientSecret: (googleClientSecret) => set({ googleClientSecret }),

  gmailAccounts: [],
  setGmailAccounts: (gmailAccounts) =>
    set((state) => ({
      gmailAccounts:
        typeof gmailAccounts === "function"
          ? gmailAccounts(state.gmailAccounts)
          : gmailAccounts,
    })),

  categories: {
    to_respond: true,
    fyi: true,
    comment: true,
    notification: true,
    meeting_update: true,
    awaiting_reply: true,
    actioned: true,
    custom_properties: {},
  },
  setCategories: (categories) => set({ categories }),

  showAddAccountPopup: false,
  setShowAddAccountPopup: (value) => set({ showAddAccountPopup: value }),

  isConnectingGmail: false,
  setIsConnectingGmail: (value) => set({ isConnectingGmail: value }),

  fetchUserId: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) {
      const {
        setUserId,
        fetchCategories,
        fetchGmailCredentials,
        fetchEmailTaggingStatus,
        checkEmailRecord,
      } = get();
      setUserId(session.user.id);
      fetchCategories(session.user.id);
      fetchGmailCredentials(session.user.id);
      fetchEmailTaggingStatus(session.user.id);
      checkEmailRecord(session.user.id);
    }
  },

  fetchGmailCredentials: async (uid) => {
    const {
      setGoogleClientId,
      setGoogleClientSecret,
      setRefreshToken,
      setEmailAddress,
      setGmailAccounts,
    } = get();

    try {
      console.log("Fetching Gmail credentials for user: ", uid);

      // Check the current session and token
      const { data: session } = await supabase.auth.getSession();
      console.log("Current session:", {
        user_id: session.session?.user?.id,
        access_token: session.session?.access_token ? "EXISTS" : "MISSING",
        token_type: session.session?.token_type,
        expires_at: session.session?.expires_at,
      });

      const { data: gmailData, error } = await supabase
        .from("user_gmails")
        .select(
          `email_address, refresh_token, google_cohort, google_clients (client_id, client_secret)`,
        )
        .eq("user_id", uid);

      console.log("Gmail query result:", { gmailData, error });

      if (error) throw error;

      if (gmailData && gmailData.length > 0) {
        console.log("Found Gmail accounts:", gmailData);

        setGmailAccounts(gmailData);

        // Set the first account as default for backward compatibility
        const firstAccount = gmailData[0];
        if (firstAccount) {
          setEmailAddress(firstAccount.email_address);
          setRefreshToken(firstAccount.refresh_token);
          setGoogleClientId(firstAccount.google_clients[0]?.client_id);
          setGoogleClientSecret(firstAccount.google_clients[0]?.client_secret);
        } else {
          console.log("No Gmail accounts found");
        }
      } else {
        console.log("No Gmail data found or empty array");
      }
    } catch (error: unknown) {
      console.error("Error fetching Gmail credentials:", error);
    }
  },

  fetchCategories: async (uid) => {
    const { setCategories } = get();
    try {
      const response = await fetch(`/api/email-preferences?userId=${uid}`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error: unknown) {
      console.error("Error fetching email categories:", error);
      toast.error("Failed to load email preferences");
    }
  },

  fetchEmailTaggingStatus: async (uid) => {
    const { setEmailTaggingEnabled } = get();

    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("email_tagging_enabled")
        .eq("id", uid)
        .single();

      if (error) throw error;
      setEmailTaggingEnabled(userData.email_tagging_enabled || false);
    } catch (error: unknown) {
      console.error("Error fetching email tagging status:", error);
      toast.error("Failed to load email tagging status");
    }
  },

  checkEmailRecord: async (uid) => {
    const { setHasEmailRecord } = get();
    try {
      const { data, error } = await supabase
        .from("emails")
        .select("id")
        .eq("user_id", uid)
        .limit(1);

      if (error) throw error;
      setHasEmailRecord(data && data.length > 0);
    } catch (error: unknown) {
      console.error("Error checking email record:", error);
      setHasEmailRecord(false);
    }
  },

  handleCategoryToggle: async (category, checked) => {
    const { categories, setCategories, userId } = get();
    try {
      const newCategories = {
        ...categories,
        // Following logic throws error
        // categories: { ...categories.categories, [category]: checked },
        [category]: checked,
      };

      const response = await fetch("/api/email-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          categories: newCategories,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCategories(newCategories);
        toast.success(`${category.replace("_", " ")} category updated`);
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  },

  processGmailLabels: async () => {
    const {
      gmailAccounts,
      emailTaggingEnabled,
      isProcessingEmails,
      setIsProcessingEmails,
      userId,
    } = get();

    console.log("processGmailLabels function called!");
    console.log("gmailAccounts:", gmailAccounts);
    console.log("emailTaggingEnabled:", emailTaggingEnabled);
    console.log("isProcessingEmails:", isProcessingEmails);

    try {
      setIsProcessingEmails(true);

      if (gmailAccounts.length === 0) {
        console.log("No Gmail accounts found - returning early");
        toast.error(
          "No Gmail accounts connected. Please go to Settings to connect your Google account first.",
        );
        return;
      }

      let totalProcessed = 0;
      console.log(gmailAccounts);
      console.log("processing emails");

      // Process each Gmail account
      for (const account of gmailAccounts) {
        const response = await fetch("/api/gmail/process-labels", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            emailAddress: account.email_address,
            useStandardColors: true,
            maxEmails: 20,
            googleClientId: account.google_clients[0]?.client_id, // TODO?: the google_clients[0] is not present in the original JS code and causes an error in TS version
            googleClientSecret: account.google_clients[0]?.client_secret, // TODO?: the google_clients[0] is not present in the original JS code and causes an error in TS version
            refreshToken: account.refresh_token,
          }),
        });
      }
    } catch (error: unknown) {
      console.error("Error processing Gmail labels:", error);
      toast.error("Failed to process emails");
    }
  },

  handleGmailConnect: async () => {
    const { setIsConnectingGmail, userId } = get();
    try {
      setIsConnectingGmail(true);

      const response = await fetch("/api/google/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          source: "emails", // This will help redirect back to emails page
          upgradeToFull: false, // Gmail only access
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        // Store that we're coming from emails page
        sessionStorage.setItem("oauth_return_path", "/emails");
        // Redirect to Google Oauth
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to initiate Gmail connection");
      }
    } catch (error: unknown) {
      console.error("Error connecting Gmail:", error);
      toast.error("Failed to connect Gmail. Please try again.");
      setIsConnectingGmail(false);
    }
  },

  handleGmailDisconnect: async (emailAddress) => {
    const { userId, setGmailAccounts } = get();
    try {
      const { error: gmailError } = await supabase
        .from("user_gmails")
        .delete()
        .eq("user_id", userId)
        .eq("email_address", emailAddress);

      if (gmailError) throw gmailError;

      // update local state
      setGmailAccounts((prev) =>
        prev.filter((acc) => acc.email_address !== emailAddress),
      );

      toast.success(`${emailAddress} disconnected successfully`);
    } catch (error: unknown) {
      console.error("Error disconnecting Gmail:", error);
      toast.error("Failed to disconnect Gmail account");
    }
  },

  handleEmailTaggingToggle: async (checked) => {
    const { userId, setEmailTaggingEnabled } = get();

    try {
      const { error } = await supabase
        .from("users")
        .update({ email_tagging_enabled: checked })
        .eq("id", userId);

      if (error) throw error;
      setEmailTaggingEnabled(checked);
    } catch (error: unknown) {
      console.error("Error updating email tagging status:", error);
      toast.error("Failed to update email tagging status");
    }
  },

  handleEmailClick: (sender) => {
    if (sender === "Sanskar Jethi") {
      window.open("https://www.linkedin.com/in/sanskar123/", "_blank");
    } else if (sender === "Arsen Kylyshbek") {
      window.open("https://www.linkedin.com/in/arsenkk/", "_blank");
    }
  },
}));
