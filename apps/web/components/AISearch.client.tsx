"use client";

import { supabase } from "@amurex/supabase";
import { useSearchStore } from "@amurex/ui/store";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export const AISearchClient = ({ children }: { children: React.ReactNode }) => {
  const {
    inputValue,
    setSelectedSuggestion,
    session,
    setUserName,
    personalizedPrompts,
    setRandomPrompt,
    handleHotKey,
    isSearchInitiated,
    showSpotlight,
    setSession,
    messageHistory,
    setMessageHistory,
    setSidebarSessions,
    setGroupedSidebarSessions,
    setCollapsedDays,
    setIsWaitingSessions,
    setHasGmail,
    setHasNotion,
    setHasObsidian,
    setGoogleTokenVersion,
    setHasGoogleDocs,
    setHasMeetings,
    hasSeenOnboarding,
    setSuggestedPrompts,
    hasGmail,
    setGmailProfiles,
  } = useSearchStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!session?.user?.id) return;

    // Get user's name using RPC instead of directly querying the users table
    supabase
      .rpc("get_auth_user_by_public_id", {
        p_user_id: session.user.id,
      })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching user data:", error);
          return;
        }

        const first_name = data[0]?.first_name;
        setUserName(first_name);

        // Select a random prompt and personalize it with the user's name
        const randomIndex = Math.floor(
          Math.random() * personalizedPrompts.length,
        );
        let prompt = personalizedPrompts[randomIndex];

        // Replace {name} placeholder with actual name if the prompt has it
        if (prompt?.includes("{name}") && first_name) {
          prompt = prompt.replace("{name}", first_name);
        }

        if (prompt) {
          setRandomPrompt(prompt);
        }
      });
  }, [session?.user?.id]);

  // Reset selected suggestion when input changes
  useEffect(() => {
    setSelectedSuggestion(-1);
  }, [inputValue]);

  useEffect(() => {
    window.addEventListener("keydown", handleHotKey);

    return () => window.removeEventListener("keydown", handleHotKey);
  }, []);

  // Add auto-focus on input when typing - PLACED AFTER ALL STATE DECLARATIONS
  useEffect(() => {
    // Only add this listener when a thread is active and not when spotlight is open
    if (isSearchInitiated && !showSpotlight) {
      const handleKeyPress = (e: KeyboardEvent) => {
        // Ignore if user is typing in an input or pressing modifier keys
        if (
          (e.target instanceof Element &&
            (e.target.tagName === "INPUT" ||
              e.target.tagName === "TEXTAREA")) ||
          e.metaKey ||
          e.ctrlKey ||
          e.altKey
        ) {
          return;
        }

        // Focus the input field when user starts typing
        const input = document.querySelector(".followUpInputArea input");
        if (input instanceof HTMLInputElement) {
          input.focus();
        }
      };

      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }
  }, [isSearchInitiated, showSpotlight]);

  // Auto scroll to the end of the messages
  useEffect(() => {
    setTimeout(() => {
      // TODO?: the ref is not passed down to any element in original codebase
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  // Modify the session check useEffect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Redirect if no session
      if (!session) {
        const currentPath = window.location.pathname + window.location.search;
        const encodedRedirect = encodeURIComponent(currentPath);
        router.push(`/web_app/signin?redirect=${encodedRedirect}`);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Redirect if session is terminated
      if (!session) {
        const currentPath = window.location.pathname + window.location.search;
        const encodedRedirect = encodeURIComponent(currentPath);
        router.push(`/web_app/signin?redirect=${encodedRedirect}`);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Update message history fetch with user_id
  useEffect(() => {
    if (!session?.user?.id) return;

    const handleInserts = (payload: any) => {
      if (payload.new.user_id !== session.user.id) return;
      const lastMessage = messageHistory[messageHistory.length - 1];
      const isSameType =
        lastMessage?.payload?.type === "GPT" &&
        payload.new.payload.type === "GPT";
      const newMessageHistory = isSameType
        ? [...messageHistory.slice(0, -1), payload.new]
        : [...messageHistory, payload.new];

      setMessageHistory(newMessageHistory);
    };

    const channel = supabase
      .channel("message_history")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_history",
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => handleInserts(payload),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to message_history");
        } else if (status === "CLOSED") {
          console.log("Channel closed, attempting to resubscribe...");
          // Attempt to resubscribe after a short delay
          setTimeout(() => {
            channel.subscribe();
          }, 1000);
        }
      });

    // Initial fetch of message history
    supabase
      .from("message_history")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true })
      .then(({ data: message_history, error }) =>
        error
          ? console.log("error", error)
          : setMessageHistory(message_history),
      );

    // fetching user's sessions
    const fetchUserThreads = async () => {
      if (!session?.user?.id) return;

      try {
        const { data, error } = await supabase
          .from("threads")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching threads:", error);
          return;
        }

        console.log(data);

        // Group threads by day
        const groupedThreads: { [key: string]: any[] } = {};
        const initialCollapsedState: { [key: string]: boolean } = {};

        data.forEach((thread) => {
          const date = new Date(thread.created_at);
          const dateString = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          });

          if (!groupedThreads[dateString]) {
            groupedThreads[dateString] = [];
            // Initialize all days as expanded by default
            initialCollapsedState[dateString] = false;
          }
          groupedThreads[dateString].push(thread);
        });

        setSidebarSessions(data);
        setGroupedSidebarSessions(groupedThreads);
        // Initialize collapsed state for all days
        setCollapsedDays(initialCollapsedState);
        setIsWaitingSessions(false);
      } catch (err) {
        setIsWaitingSessions(false);
        console.error("Unexpected error:", err);
      }
    };
    fetchUserThreads();

    // Cleanup function
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [session?.user?.id]);

  // Update the useEffect for checking all connections
  useEffect(() => {
    if (!session?.user?.id) return;

    let googleConnected = false;
    let notionConnected = false;
    let connectionsChecked = 0;

    // Check Google Docs connection
    supabase
      .from("users")
      .select("google_token_version")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        // Check if google_token_version exists (not null)
        googleConnected = !!data?.google_token_version;

        // Set the token version
        setGoogleTokenVersion(data?.google_token_version);

        // Set availability based on token version
        // Google Docs is only available with "full" access
        setHasGoogleDocs(
          googleConnected && data?.google_token_version === "full",
        );

        connectionsChecked++;
        if (connectionsChecked === 3) {
          checkOnboarding(googleConnected, notionConnected);
        }
      });

    // Check Gmail connection by checking user_gmails table
    supabase
      .from("user_gmails")
      .select("id")
      .eq("user_id", session.user.id)
      .limit(1)
      .then(({ data }) => {
        const hasGmailData = !!data?.length;
        setHasGmail(hasGmailData);

        connectionsChecked++;
        if (connectionsChecked === 3) {
          checkOnboarding(googleConnected, notionConnected);
        }
      });

    // Check if user has any meetings
    supabase
      .from("late_meeting")
      .select("id")
      .contains("user_ids", [session.user.id])
      .limit(1)
      .then(({ data }) => {
        const hasMeetingsData = !!data?.length;
        setHasMeetings(hasMeetingsData);
      });

    // Check Notion connection
    supabase
      .from("users")
      .select("notion_connected")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        notionConnected = !!data?.notion_connected;
        setHasNotion(notionConnected);
        connectionsChecked++;
        if (connectionsChecked === 3) {
          checkOnboarding(googleConnected, notionConnected);
        }
      });

    // Check if user has any Obsidian documents
    supabase
      .from("documents")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("type", "obsidian")
      .limit(1)
      .then(({ data }) => {
        const hasObsidianData = !!data?.length;
        setHasObsidian(hasObsidianData);
      });

    // Helper function to check if onboarding should be shown
    const checkOnboarding = (google: any, notion: any) => {
      // Disabled onboarding modal completely as requested
      // if (!google && !notion && !hasSeenOnboarding) {
      //   setShowOnboarding(true);
      // }
    };
  }, [session?.user?.id, hasSeenOnboarding]);

  // Add new useEffect to fetch documents and generate prompts
  useEffect(() => {
    if (!session?.user?.id) return;

    supabase
      .from("documents")
      .select("title, text")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(async ({ data, error }) => {
        if (error) {
          console.error("Error fetching documents:", error);
          return;
        }

        // Send the documents to the backend
        // const apiResponse = await fetch("/api/search", {
        //   method: "POST",
        //   body: JSON.stringify({
        //     documents: data,
        //     user_id: session.user.id,
        //     type: "prompts", // Add type to differentiate the request
        //   }),
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        // });

        // hardcoded prompts
        const response = {
          prompts: [
            {
              type: "prompt",
              text: "What is the most important thing I need to do today?",
            },
            { type: "prompt", text: "What was my last purchase?" },
            { type: "prompt", text: "Draft an email to person X about " },
          ],
          ok: true,
        };

        if (!response.ok) {
          console.error("Error generating prompts");
          return;
        }

        const { prompts } = response;
        setSuggestedPrompts(prompts); // Access the nested prompts array
      });
  }, [session?.user?.id]);

  // Update useEffect to fetch Gmail profiles
  useEffect(() => {
    const fetchGmailProfiles = async () => {
      if (hasGmail && session?.user?.id) {
        try {
          const response = await fetch(
            `/api/google/profile?userId=${session.user.id}`,
          );
          const data = await response.json();
          if (data.success) {
            setGmailProfiles(data.emails);
          }
        } catch (error) {
          console.error("Error fetching Gmail profiles:", error);
        }
      }
    };

    fetchGmailProfiles();
  }, [hasGmail, session?.user?.id]);

  return <>{children}</>;
};
