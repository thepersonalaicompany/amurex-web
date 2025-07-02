"use client";

import { create } from "zustand";
import {
  SearchStoreType,
  MessageHistoryItem,
  MessagePayload,
  Session,
  ThreadItem,
} from "./types";
import { supabase } from "@amurex/supabase";
import { useRouter } from "next/navigation";
import { BASE_URL_BACKEND } from "@amurex/ui/lib";

export type { MessagePayload };

export const useSearchStore = create<SearchStoreType>()((set, get) => ({
  selectedSuggestion: -1,
  setSelectedSuggestion: (value: number) => set({ selectedSuggestion: value }),
  dropDownTimeout: null,
  setDropDownTimeout: (value) => set({ dropDownTimeout: value }),

  // Input state
  inputValue: "",
  setInputValue: (value: string) => set({ inputValue: value }),

  // Message history
  messageHistory: [],
  setMessageHistory: (message) => {
    const newMessage: MessageHistoryItem = {
      id: Date.now(),
      user_id: get().session?.user_id || "",
      payload: { type: "USER", content: message },
      created_at: new Date().toISOString(),
      type: message[0]?.type || "USER",
    };
    set((state) => ({
      messageHistory: [...state.messageHistory, newMessage],
    }));
  },

  // Session management
  session: null,
  setSession: (session: Session | null) => set({ session }),

  // Search Query
  query: "",
  setQuery: (query: string) => set({ query }),

  // Search results
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),

  // Search state
  isSearching: false,
  setIsSearching: (value: boolean) => set({ isSearching: value }),

  isSearchInitiated: false,
  setIsSearchInitiated: (value: boolean) => set({ isSearchInitiated: value }),

  // Spotlight state
  spotlightInputValue: "",
  setSpotlightInputValue: (value: string) =>
    set({ spotlightInputValue: value }),

  // Suggested prompts
  suggestedPrompts: [],
  setSuggestedPrompts: (prompts: MessagePayload[]) =>
    set({ suggestedPrompts: prompts }),

  // Onboarding state
  showOnboarding: false,
  setShowOnboarding: (value: boolean) => set({ showOnboarding: value }),

  hasSeenOnboarding: false,
  setHasSeenOnboarding: (value: boolean) => set({ hasSeenOnboarding: value }),

  // Timing metrics
  searchStartTime: null,
  setSearchStartTime: (value: number) => set({ searchStartTime: value }),

  sourcesTime: null,
  setSourcesTime: (value) => set({ sourcesTime: value }),

  completionTime: null,
  setCompletionTime: (value) => set({ completionTime: value }),

  // Sidebar state
  isSidebarOpened: false,
  setIsSidebarOpened: (value: boolean) => set({ isSidebarOpened: value }),

  sidebarSessions: [],
  setSidebarSessions: (value: Session[]) => set({ sidebarSessions: value }),

  groupedSidebarSessions: {},
  setGroupedSidebarSessions: (value: { [key: string]: Session[] }) =>
    set({ groupedSidebarSessions: value }),

  collapsedDays: {},
  setCollapsedDays: (value: { [key: string]: boolean }) =>
    set({ collapsedDays: value }),

  isWaitingSessions: false,
  setIsWaitingSessions: (value: boolean) => set({ isWaitingSessions: value }),

  // Thread management
  currentThread: [],
  setCurrentThread: (value) => set({ currentThread: value }),

  currentThreadId: "",
  setCurrentThreadId: (value) => set({ currentThreadId: value }),

  // Deletion confirmation
  isDeletionConfirmationPopupOpened: false,
  setIsDeletionConfirmationPopupOpened: (value: boolean) =>
    set({ isDeletionConfirmationPopupOpened: value }),

  deletionConfirmation: {
    deletingThread: { title: "" },
    isWaiting: false,
    error: null,
  },
  setDeletionConfirmation: (value) => set({ deletionConfirmation: value }),

  // UI visibility states
  showSpotlight: false,
  setShowSpotlight: (value) => set({ showSpotlight: value }),

  showGoogleDocs: false,
  setShowGoogleDocs: (value) => set({ showGoogleDocs: value }),

  showNotion: false,
  setShowNotion: (value) => set({ showNotion: value }),

  showMeetings: false,
  setShowMeetings: (value) => set({ showMeetings: value }),

  showObsidian: false,
  setShowObsidian: (value) => set({ showObsidian: value }),

  showGmail: false,
  setShowGmail: (value) => set({ showGmail: value }),

  // Integration states
  hasGoogleDocs: false,
  setHasGoogleDocs: (value) => set({ hasGoogleDocs: value }),

  hasMeetings: false,
  setHasMeetings: (value) => set({ hasMeetings: value }),

  hasNotion: false,
  setHasNotion: (value) => set({ hasNotion: value }),

  hasObsidian: false,
  setHasObsidian: (value) => set({ hasObsidian: value }),

  hasGmail: false,
  setHasGmail: (value) => set({ hasGmail: value }),

  // Google integration
  googleTokenVersion: null,
  setGoogleTokenVersion: (value) => set({ googleTokenVersion: value }),

  showGoogleDocsModal: false,
  setShowGoogleDocsModal: (value) => set({ showGoogleDocsModal: value }),

  showGmailModal: false,
  setShowGmailModal: (value) => set({ showGmailModal: value }),

  showBroaderAccessModal: false,
  setShowBroaderAccessModal: (value) => set({ showBroaderAccessModal: value }),

  isGoogleAuthInProgress: false,
  setIsGoogleAuthInProgress: (value) => set({ isGoogleAuthInProgress: value }),

  // User info
  userName: "",
  setUserName: (value) => set({ userName: value }),

  randomPrompt: "",
  setRandomPrompt: (value) => set({ randomPrompt: value }),

  // Gmail specific
  gmailProfiles: [],
  setGmailProfiles: (value) => set({ gmailProfiles: value }),

  isGmailDropDownVisible: false,
  setIsGmailDropDownVisible: (value) => set({ isGmailDropDownVisible: value }),

  // Prompts
  personalizedPrompts: [],

  // Action handlers
  handleHotKey: (e) => {
    const { setShowSpotlight } = get();
    // Check for Cmd+K or Ctrl+K
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      // Just show spotlight without resetting thread
      setShowSpotlight(true);
    }
  },

  handleSpotlightSearch: () => {
    const {
      query,
      setShowSpotlight,
      setInputValue,
      setIsSearchInitiated,
      sendMessage,
    } = get();

    setShowSpotlight(false);
    setInputValue(query);
    setIsSearchInitiated(true);

    // Call sendMessage with isNewSearch=true
    sendMessage(query, true);
  },

  handleNewSearch: () => {
    const { setShowSpotlight } = get();
    setShowSpotlight(true);
  },

  openThread: async (threadId) => {
    const {
      setShowSpotlight,
      setCurrentThreadId,
      setCurrentThread,
      setIsSearchInitiated,
      setIsWaitingSessions,
    } = get();

    console.log("opening thread" + threadId);

    setShowSpotlight(false); // close spotlight if open

    if (!threadId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching threads:", error);
        return;
      }

      const transformedData = data.map(
        ({ completion_time, sources, ...rest }) => ({
          ...rest,
          completionTime: completion_time,
          sources: JSON.parse(sources),
        }),
      );
      console.log(transformedData);

      setCurrentThreadId(threadId);
      setCurrentThread(transformedData);
      setIsSearchInitiated(true);
    } catch (err) {
      setIsWaitingSessions(false);
      console.error("Unexpected error:", err);
    }
  },

  deleteThread: async () => {
    const {
      deletionConfirmation,
      setDeletionConfirmation,
      setSidebarSessions,
      sidebarSessions,
      setGroupedSidebarSessions,
      groupedSidebarSessions,
      setIsDeletionConfirmationPopupOpened,
    } = get();

    console.log(`Deleting: ${deletionConfirmation?.deletingThread}`);
    console.log(deletionConfirmation?.deletingThread);

    try {
      if (deletionConfirmation?.deletingThread) {
        const threadId = deletionConfirmation?.deletingThread?.id;
        setDeletionConfirmation({
          ...deletionConfirmation,
          isWaiting: true,
          error: "",
        });

        // Delete thread from DB
        const { error } = await supabase
          .from("threads")
          .delete()
          .eq("id", threadId);

        if (error) {
          console.error("Error deleting thread:", error.message);
          setDeletionConfirmation({
            ...deletionConfirmation,
            isWaiting: false,
            error: "Failed to delete thread from server",
          });
          return;
        }

        // Remove from client-side list
        setSidebarSessions(
          sidebarSessions.filter((session) => session.id !== threadId),
        );

        // Also update the grouped sessions
        const newGrouped = { ...groupedSidebarSessions };
        //Loop through each day group
        Object.keys(newGrouped).forEach((date) => {
          // Filter out the deleted thread from this day's threads
          if (!newGrouped[date]) return; // TODO?: added to remove TS error
          newGrouped[date] = newGrouped[date]?.filter(
            (session) => session.id !== threadId,
          );
          // If this day now has no threads, remove the day entirely
          if (newGrouped[date].length === 0) {
            delete newGrouped[date];
          }
        });

        setGroupedSidebarSessions(newGrouped);

        setIsDeletionConfirmationPopupOpened(false);
        setTimeout(() => {
          setDeletionConfirmation({
            deletingThread: {
              title: "None",
            },
            isWaiting: false,
            error: "",
          });
        }, 400);
      }
    } catch (e) {
      console.log(e);
      setDeletionConfirmation({
        ...deletionConfirmation,
        isWaiting: false,
        error: "Something went wrong. Please try again later",
      });
    }
  },

  initiateGoogleAuth: async () => {
    const { setIsGoogleAuthInProgress, session } = get();

    try {
      setIsGoogleAuthInProgress(true);

      // Call the Google auth API directly
      const response = await fetch("/api/google/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user.id,
          source: "search",
          upgradeToFull: true,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Google auth URL
        window.location.href = data.url;
      } else {
        throw new Error("Failed to get Google auth URL");
      }
    } catch (error) {
      console.error("Error initiating Google auth:", error);
      setIsGoogleAuthInProgress(false);
    }
  },

  // Add function to initiate Google auth
  initiateGmailAuth: async () => {
    const { session } = get();

    try {
      // Create a loading indicator or state if needed

      // the Google auth API directly with gmail_only type
      const response = await fetch("/api/google/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user.id,
          source: "search", // Current page
          upgradeToFull: false, // Gmail only
          returnTo: "/search", // Return to search page after auth
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Google auth URL
        window.location.href = data.url;
      } else {
        throw new Error("Failed to get Google auth URL");
      }
    } catch (error) {
      console.error("Error initiating Gmail auth:", error);
    }
  },

  // Function to handle Google Docs button click
  handleGoogleDocsClick: () => {
    const {
      setShowGoogleDocs,
      hasGoogleDocs,
      showGoogleDocs,
      googleTokenVersion,
      setShowGoogleDocsModal,
      setShowBroaderAccessModal,
    } = get();

    // Tooggle visibility regardless of connection status
    setShowGoogleDocs(!showGoogleDocs);

    // If not connected, show the appropriate modal
    if (!hasGoogleDocs) {
      if (googleTokenVersion === "old" || googleTokenVersion === null) {
        setShowGoogleDocsModal(true);
      } else if (googleTokenVersion === "gmail_only") {
        setShowBroaderAccessModal(true);
      } else {
        window.location.href = "/settings?tab=personalization";
      }
    }
  },

  // Function to handle Gmail button click
  handleGmailClick: () => {
    const {
      setShowGmail,
      showGmail,
      hasGmail,
      googleTokenVersion,
      setShowGmailModal,
    } = get();
    // Toggle visibility regardless of connection status
    setShowGmail(!showGmail);

    // If not connected, show the appropriate modal
    if (!hasGmail) {
      if (googleTokenVersion === "old" || googleTokenVersion === null) {
        setShowGmailModal(true);
      } else {
        window.location.href = "/settings?tab=personalization";
      }
    }
  },

  // Function to handle Notion button click
  handleNotionClick: () => {
    const { setShowNotion, showNotion, hasNotion } = get();

    // Toggle visibility regardless of connection status
    setShowNotion(!showNotion);

    // If not connected, redirect to settings
    if (!hasNotion) {
      window.location.href = "/settings?tab=personalization";
    }
  },

  // Function to handle Obsidian button click
  handleObsidianClick: () => {
    const { setShowObsidian, showObsidian, hasObsidian } = get();

    // Toggle visibility regardless of connection status
    setShowObsidian(!showObsidian);

    // If not connected, redirect to settings
    if (!hasObsidian) {
      window.location.href = "/settings?tab=personalization";
    }
  },

  // Function to handle Meetings button click
  handleMeetingsClick: () => {
    const { showMeetings, setShowMeetings } = get();

    // Toggle visibility (no connection needed)
    setShowMeetings(!showMeetings);
  },

  // to imitate useMemo using zustand
  content: [],
  filters: {},

  filteredSources: () => {
    const { content, filters } = get();

    // Implementation for filtering sources
    if (!content || !Array.isArray(content)) return [];

    return content
      .filter((source) => {
        const sourceType = source.type;

        // Apply filters based on source type
        if (sourceType === "google_dosc" && !filters.showGoogleDocs) {
          return false;
        }

        if (sourceType === "notion" && !filters.showNotion) {
          return false;
        }

        if (
          (sourceType === "msteams" || sourceType === "google_meet") &&
          !filters.showMeetings
        ) {
          return false;
        }

        if (sourceType === "obsidian" && !filters.showObsidian) {
          return false;
        }

        if (
          (sourceType === "gmail" || sourceType === "email") &&
          !filters.showGmail
        ) {
          return false;
        }

        // Includes sources with unknown types
        return true;
      })
      .slice(0, 3); // Limit to top 3 sources
  },

  fetchSession: async () => {
    const router = useRouter();

    const { data: session } = await supabase.auth.getSession();

    if (!session) {
      router.push("/web_app/signin");
      return null;
    }
    return session;
  },

  logUserAction: async (userId: string, eventType: string) => {
    try {
      // First check if memory_enabled is true for this user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("memory_enabled")
        .eq("id", userId)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return;
      }

      // Only track if memory_enabled is true
      if (userData?.memory_enabled) {
        await fetch(`${BASE_URL_BACKEND}/track`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            uuid: userId,
            event_type: eventType,
          }),
        });
      }
    } catch (error) {
      console.error("Error tracking:", error);
    }
  },

  sendMessage: async (messageToSend, isNewSearch = false) => {
    // import all dependencies from store
    const {
      session,
      inputValue,
      setCurrentThread,
      currentThreadId,
      setCurrentThreadId,
      showSpotlight,
      currentThread,
      sidebarSessions,
      setSidebarSessions,
      groupedSidebarSessions,
      setGroupedSidebarSessions,
      setInputValue,
      setIsSearching,
      setIsSearchInitiated,
      setSearchStartTime,
      setSourcesTime,
      setCompletionTime,
      setSearchResults,
      searchResults,
    } = get();

    // 1. return if session is null
    if (!session?.user?.id) return;

    const message = messageToSend || inputValue;

    // 2. Reset current thread if this is a new search from spotlight or explicitly marked as new search
    if (showSpotlight || isNewSearch) {
      setCurrentThread([]);
      setCurrentThreadId("");
    }

    // 3. Update current thread with new message
    setCurrentThread([
      ...currentThread,
      {
        query: message,
        sources: [],
        vectorResults: [],
        answer: "",
      },
    ]);

    // 4. Check if message is empty
    if (!message.trim()) return;

    // 5. Send the message
    let threadId = "";

    try {
      // A. Create a new thread if we don't have a current thread ID or this is explicitly a new search
      if (!currentThreadId || isNewSearch) {
        console.log("creating new thread");

        const { data: threadData, error: threadError } = await supabase
          .from("threads")
          .insert([
            {
              user_id: session.user.id,
              title: message.slice(0, 50), // use first 50 chars as title
            },
          ])
          .select()
          .single();

        if (threadError) {
          console.error("Error creating thread:", threadError);
          return;
        }

        threadId = threadData.id;
        setCurrentThreadId(threadId);

        // B. IMMEDIATELY update the sidebar with the new thread
        setSidebarSessions([
          {
            id: threadData.id,
            title: message.slice(0, 50),
            created_at: new Date().toISOString(),
            user_id: session.user.id,
            user: { id: session.user.id },
          },
          ...sidebarSessions,
        ]);

        // C. add the new thread to groupedSidebarSessions
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

        const newGrouped = { ...groupedSidebarSessions };

        if (!newGrouped[today]) {
          newGrouped[today] = [];
        }

        newGrouped[today] = [
          {
            id: threadData.id,
            title: message.slice(0, 50),
            created_at: new Date().toISOString(),
            user_id: session.user.id,
            user: { id: session.user.id },
          },
          ...newGrouped[today],
        ];

        setGroupedSidebarSessions(newGrouped);
      } else {
        // Assign current thread ID if we already have one
        threadId = currentThreadId;
      }

      console.log("✅ Thread Ceated Successfully!");
    } catch (error) {
      console.error("Unexpected error:", error);
    }

    // 6. Set input value to empty and start searching

    setInputValue("");
    setIsSearching(true);
    setIsSearchInitiated(true);

    // 7. Reset all timing metrics
    const startTime = performance.now();
    setSearchStartTime(startTime);
    setSourcesTime(null);
    setCompletionTime(null);

    setSearchResults({
      query: message,
      sources: [],
      vectorResults: [],
      answer: "",
    });

    // 8. Transform existing messages into role-reply format
    const transformedMessages = currentThread.map((item) => {
      const result = [];

      if (item.query) {
        result.push({ role: "user", content: item.query });
      }

      if (item.reply) {
        result.push({
          role: "assistant",
          content: `${item.reply}
          
sources: ${JSON.stringify(item.sources)}`,
        });
      }
      return result;
    });

    console.log(transformedMessages);

    // 9. Send the new-message along with the role-reply format as context
    fetch("/api/search", {
      method: "POST",
      body: JSON.stringify({
        context: transformedMessages,
        message,
        user_id: session.user.id,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Network response was not ok");

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sourcesReceived = false;
        let firstChunkReceived = false;

        let finalAnswer = "";
        let finalSources: {
          source: string;
          id: number;
          title: string;
          content: string;
          url: string;
          similarity: number;
          text_rank: number | null;
          hybrid_score: number | null;
          type: string;
          from?: string;
        }[] = [];

        // Update thread in real-time during streaming
        const updateThreadWithStreamingContent = (chunk: string) => {
          const updatedThread = [...currentThread];
          // Only update the last item in the thread array
          if (updatedThread.length > 0) {
            const lastIndex = updatedThread.length - 1;
            const lastItem = updatedThread[lastIndex];
            if (lastItem) {
              updatedThread[lastIndex] = {
                ...lastItem,
                query: lastItem.query.toString(),
                sources: lastItem.sources,
                reply: lastItem.reply?.toString() + chunk,
              };
            }
          }
          setCurrentThread(updatedThread);
        };

        const readStream = () => {
          if (reader) {
            reader
              .read()
              .then(async ({ done, value }) => {
                if (done) {
                  // Record final completion time when stream ends
                  const endTime = performance.now();
                  let completionTimeLocal = (
                    (endTime - startTime) /
                    1000
                  ).toFixed(1); // added "local" just to avoid collision with another var (gotta delete another var in the future)
                  setCompletionTime(((endTime - startTime) / 1000).toFixed(1));

                  setIsSearching(false);
                  console.log("done!");

                  // writing results as the last element of currentThread
                  // This is now just a safety measure as the thread is updated in real-time
                  const updatedThread = currentThread.map((item, index) => {
                    if (index == currentThread.length - 1) {
                      console.log("Updating last message with final content");
                      return {
                        ...item,
                        sources: finalSources,
                        reply: finalAnswer,
                        completionTime: Number(completionTimeLocal),
                      } as ThreadItem;
                    }
                    return item;
                  });
                  setCurrentThread(updatedThread);

                  try {
                    console.log(message);
                    console.log({
                      thread_id: threadId,
                      query: message,
                      reply: finalAnswer,
                      sources: JSON.stringify(finalSources),
                      completion_time: parseFloat(completionTimeLocal),
                    });
                    const { error: messageError } = await supabase
                      .from("messages")
                      .insert([
                        {
                          thread_id: threadId,
                          query: message,
                          reply: finalAnswer,
                          sources: JSON.stringify(finalSources),
                          completion_time: parseFloat(completionTimeLocal),
                        },
                      ]);

                    if (messageError) {
                      console.error("Error adding message:", messageError);
                      return;
                    }
                  } catch (e) {
                    console.error("Failed to upload assistand response:", e);
                  }

                  return;
                }

                buffer += decoder.decode(value, { stream: true });

                try {
                  // Split by newlines and filter out empty lines
                  const lines = buffer
                    .split("\n")
                    .filter((line) => line.trim());

                  // Process each complete line
                  for (let i = 0; i < lines.length; i++) {
                    try {
                      if (lines[i]) {
                        const data = JSON.parse(lines[i] as string);

                        // Update search results
                        if (data.success) {
                          // Track when sources first arrive
                          if (
                            data.sources &&
                            data.sources.length > 0 &&
                            !sourcesReceived
                          ) {
                            sourcesReceived = true;
                            const currentTime = performance.now();
                            setSourcesTime(
                              Number(
                                ((currentTime - startTime) / 1000).toFixed(1),
                              ),
                            );
                          }

                          // Track when first text chunk arrives
                          if (data.chunk && !firstChunkReceived) {
                            firstChunkReceived = true;
                            // If we get a large chunk at once (from Brain API), record completion time
                            if (data.chunk.length > 200) {
                              const currentTime = performance.now();
                              setCompletionTime(
                                Number(
                                  (currentTime - startTime) / 1000,
                                ).toFixed(1),
                              );
                            }
                          }

                          if (data.chunk) {
                            finalAnswer += data.chunk;
                            // Update thread in real-time with each chunk
                            updateThreadWithStreamingContent(data.chunk);
                          }

                          if (data.sources && data.sources.length > 0) {
                            finalSources = data.sources;
                          }

                          setSearchResults({
                            query: message,
                            sources:
                              data.sources ||
                              (Array.isArray(searchResults)
                                ? []
                                : searchResults.sources || []),
                            vectorResults: Array.isArray(searchResults)
                              ? []
                              : searchResults.vectorResults || [],
                            answer:
                              (Array.isArray(searchResults)
                                ? ""
                                : searchResults.answer || "") +
                              (data.chunk || ""),
                          });

                          console.log(
                            data.sources ||
                              (Array.isArray(searchResults)
                                ? []
                                : searchResults.sources || []),
                          );
                        }
                      }
                    } catch (e) {
                      console.error(
                        "Error parsing JSON:",
                        e,
                        "Line:",
                        lines[i],
                      );
                    }
                  }

                  // Keep only the incomplete line in the buffer
                  const lastNewLineIndex = buffer.lastIndexOf("\n");
                  if (lastNewLineIndex !== -1) {
                    buffer = buffer.substring(lastNewLineIndex + 1);
                  }
                } catch (e) {
                  console.error("Error processing buffer:", e);
                }

                readStream();
              })
              .catch((err) => {
                console.error("Stream reading error:", err);
                setIsSearching(false);
              });
          }

          readStream();
        };
      })
      .catch((error) => {
        console.error("Unexpected error:", error);
        setIsSearching(false);
      });
  },
  handleSpotlightSearchQuery: (query) => {
    const {
      setShowSpotlight,
      setInputValue,
      setIsSearchInitiated,
      sendMessage,
    } = get();

    setShowSpotlight(false);
    setInputValue(query);
    setIsSearchInitiated(true);
    // Call sendMessage with isNewSearch=true
    sendMessage(query, true);
  },
}));
