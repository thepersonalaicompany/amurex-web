"use client";

import { create } from "zustand";
import { BASE_URL_BACKEND } from "@amurex/ui/lib";
import { TranscriptDetailStoreTypes, ChatMessageType } from "./types";
import { supabase } from "@amurex/supabase";

export const useTranscriptDetailStore = create<TranscriptDetailStoreTypes>(
  (set, get) => ({
    memoryEnabled: false,
    setMemoryEnabled: (value) => set({ memoryEnabled: value }),

    loading: true,
    setLoading: (value) => set({ loading: value }),

    transcript: null,
    setTranscript: (value) => set({ transcript: value }),

    fullTranscriptText: "",
    setFullTranscriptText: (value) => set({ fullTranscriptText: value }),

    error: null,
    setError: (value) => set({ error: value }),

    isModalOpen: false,
    setIsModalOpen: (value) => set({ isModalOpen: value }),

    isChatOpen: false,
    setIsChatOpen: (value) => set({ isChatOpen: value }),

    isPreviewModalOpen: false,
    setIsPreviewModalOpen: (value) => set({ isPreviewModalOpen: value }),

    chatMessages: [] as ChatMessageType[],
    setChatMessages: (value) =>
      set((state) => ({
        chatMessages:
          typeof value === "function" ? value(state.chatMessages) : value,
      })),

    chatInput: "",
    setChatInput: (value) => set({ chatInput: value }),

    isSending: false,
    setIsSending: (value) => set({ isSending: value }),

    copyButtonText: "Copy share link",
    setCopyButtonText: (value) => set({ copyButtonText: value }),

    copyActionItemsText: "Copy",
    setCopyActionItemsText: (value) => set({ copyActionItemsText: value }),

    copyMeetingSummaryText: "Copy",
    setCopyMeetingSummaryText: (value) =>
      set({ copyMeetingSummaryText: value }),

    emails: [],
    setEmails: (value) => set({ emails: value }),

    emailInput: "",
    setEmailInput: (value) => set({ emailInput: value }),

    isMobile: false,
    setIsMobile: (value) => set({ isMobile: value }),

    sharedWith: [],
    setSharedWith: (value) => set({ sharedWith: value }),

    previewContent: "",
    setPreviewContent: (value) => set({ previewContent: value }),

    isLoadingPreview: false,
    setIsLoadingPreview: (value) => set({ isLoadingPreview: value }),

    session: null,
    setSession: (value) => set({ session: value }),

    logUserAction: async (userId, eventType, params) => {
      fetch(`${BASE_URL_BACKEND}/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          uuid: userId,
          event_type: eventType,
          meeting_id: params.id,
        }),
      }).catch((error) => {
        console.error("Error tracking:", error);
      });
    },

    toggleModal: () => {
      const { isModalOpen } = get();
      set({ isModalOpen: !isModalOpen });
    },

    checkMobile: () => {
      const { setIsMobile } = get();
      setIsMobile(window.innerWidth <= 768);
    },

    handleEmailInputKeyDown: (e) => {
      const { validateEmail, addEmail, emailInput } = get();
      if (e.key === "Enter" && emailInput.trim()) {
        if (validateEmail(emailInput.trim())) {
          addEmail();
        } else {
          console.error("Invalid email address");
          // Optionally, you can set an error state to display a message to the user
        }
      }
    },

    validateEmail: () => {
      const { emailInput } = get();
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(emailInput);
    },

    handleEmailInputChange: (e) => {
      const { setEmailInput } = get();
      setEmailInput(e.target.value);
    },

    addEmail: () => {
      const { emails, setEmails, emailInput, setEmailInput } = get();
      setEmails([...emails, emailInput.trim()]);
      setEmailInput("");
    },

    removeEmail: (index) => {
      const { emails, setEmails } = get();
      setEmails(emails.filter((_, i) => i !== index));
    },

    sendEmails: async (params, router) => {
      const {
        emails,
        logUserAction,
        fetchTranscript,
        setEmails,
        setIsModalOpen,
      } = get();
      const shareUrl = `${window.location.host}/shared/${params.id}`;
      let owner_email = "";

      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          router.push("/web_app/signin");
          return;
        }

        // fetch the owner's email
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("email")
          .eq("id", session.session?.user.id)
          .single();

        if (userError) throw userError;
        owner_email = userData.email;

        // Send each email to the external API
        for (const email of emails) {
          const response = await fetch(`${BASE_URL_BACKEND}/send_user_email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "meeting_share",
              owner_email: owner_email,
              email: email,
              share_url: shareUrl,
              meeting_id: params.id,
            }),
          });

          await logUserAction(
            session.session?.user.id,
            "web_share_notes_via_email",
            params,
          );

          if (!response.ok) {
            throw new Error(`Failed to send email to ${email}`);
          }
        }

        // Refresh the shaedWith list
        await fetchTranscript(params, router);

        // Clear the new emails list
        setEmails([]);

        // Ensure modal remains open
        setIsModalOpen(true);
      } catch (error) {
        console.error("Error getting user email:", error);
      }
    },

    handleCopyLink: async (params, router) => {
      const { session, setCopyButtonText, logUserAction } = get();
      if (!session || !session.user) {
        router.push("/web_app/signin");
        return;
      }
      try {
        // Get the user's email
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("email")
          .eq("id", session.user.id)
          .single();

        if (userError) throw userError;

        const userEmail = userData.email;
        const baseLink = `${window.location.host.includes("localhost") ? "http://" : "https://"}${window.location.host}/shared/${params.id}`;
        const shareText = baseLink;

        navigator.clipboard
          .writeText(shareText)
          .then(async () => {
            console.log("Link copied to clipboard");
            setCopyButtonText("Copied!"); // Change button text
            setTimeout(() => setCopyButtonText("Copy share link"), 3000); // Revert text after 3 seconds

            await logUserAction(
              session.user.id,
              "web_share_url_copied",
              params,
            );
          })
          .catch((err: unknown) => {
            console.error("Failed to copy the URL: ", err);
          });
      } catch (error: unknown) {
        console.error("Error getting user email:", error);
      }
    },

    handleDownload: async () => {
      const {
        transcript,
        setIsLoadingPreview,
        setIsPreviewModalOpen,
        setPreviewContent,
      } = get();

      if (transcript && transcript.content) {
        try {
          setIsLoadingPreview(true);
          setIsPreviewModalOpen(true);

          const response = await fetch(transcript.content);
          if (!response.ok) throw new Error("Network response was not ok");

          const text = await response.text();
          setPreviewContent(text);
          setIsLoadingPreview(false);
        } catch (error) {
          console.error("Error loading preview:", error);
          setIsLoadingPreview(false);
        }
      }
    },

    handleActualDownload: async (params, router) => {
      const { transcript, logUserAction, setIsPreviewModalOpen, session } =
        get();

      if (transcript && transcript.content) {
        try {
          const response = await fetch(transcript.content);
          if (!response.ok) throw new Error("Network response was not ok");

          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          // Preprocess the meeting title for the file name
          const fileName = transcript.title
            .toLowerCase()
            .replace(/\s+/g, "_") // Replace spaces with underscores
            .replace(/[^\w_]/g, ""); // Remove special characters

          const link = document.createElement("a");
          link.href = url;
          link.download = `${fileName}.txt`; // Use the processed title as the file name
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          if (!session || !session.user) {
            router.push("/web_app/signin");
            return;
          }

          await logUserAction(
            session.user.id,
            "web_download_transcript",
            params,
          );
          setIsPreviewModalOpen(false);
        } catch (error: unknown) {
          console.error("Error downloading transcript:", error);
        }
      }
    },

    handleActionItemClick: (params) => {
      const { logUserAction, session } = get();
      if (!session || !session.user) return;
      logUserAction(session.user.id, "web_action_item_clicked", params);
    },

    handleSummaryClick: (params, router) => {
      const { logUserAction, session } = get();
      if (!session || !session.user) {
        router.push("/web_app/signin");
        return;
      }
      logUserAction(session.user.id, "web_summary_clicked", params);
    },

    fetchTranscript: async (params, router) => {
      const { session, setSharedWith, setError, setLoading } = get();
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !session.user) {
          router.push("/web_app/signin");
          return;
        }

        const { data, error } = await supabase
          .from("late_meeting")
          .select(
            `
            id,
            meeting_id,
            user_ids,
            created_at,
            meeting_title,
            summary,
            transcript,
            action_items,
            shared_with
            `,
          )
          .eq("id", params.id)
          .contains("user_ids", [session.user.id])
          .single();
      } catch (err: any) {
        console.error("Error fetching transcript:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },

    fetchSession: async (router) => {
      const { setSession } = get();

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/web_app/signin");
        return;
      }
    },

    fetchMemoryStatus: async (router) => {
      const { setMemoryEnabled, setLoading } = get();

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/web_app/signin");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("memory_enabled")
          .eq("id", session.user.id)
          .single();

        if (error) throw error;
        setMemoryEnabled(data?.memory_enabled || false);
      } catch (error) {
        console.error("Error fetching memory status:", error);
      } finally {
        setLoading(false);
      }
    },

    handleChatSubmit: async (e) => {
      const {
        chatInput,
        isSending,
        chatMessages,
        transcript,
        fullTranscriptText,
        setChatMessages,
        setChatInput,
        setIsSending,
      } = get();

      e.preventDefault();

      if (!chatInput.trim() || isSending) return;

      const newMessage: ChatMessageType = {
        role: "user",
        content: chatInput.trim(),
      };

      setChatMessages((prev) => [...prev, newMessage]);
      setChatInput("");
      setIsSending(true);

      try {
        // TODO?: following logic was added to get rid of TS error
        if (!transcript) throw new Error("No transcript found");

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [...chatMessages, newMessage],
            transcript: {
              summary: transcript.summary,
              actionItems: transcript.actionItems,
              fullTranscript: fullTranscriptText,
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get response");
        }

        // Create a temporary message for streaming
        const tempMessage: ChatMessageType = {
          role: "assistant",
          content: "",
        };
        setChatMessages((prev) => [...prev, tempMessage]);

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = "";

        if (!reader) throw new Error("No reader found");

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          accumulatedContent += chunk;

          // Update the temporary message content
          setChatMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: "assistant",
              content: accumulatedContent,
            };
            return newMessages;
          });
        }
      } catch (error) {
        console.error("Error in chat:", error);
        const errorMessage: ChatMessageType = {
          role: "assistant",
          content:
            "Sorry, I encountered an error while processing your request. Please try again.",
        };
        setChatMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsSending(false);
      }
    },
  }),
);
