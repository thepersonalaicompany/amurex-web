"use client";
// 1. Import required dependencies
import React, { useEffect, useRef, useState, memo, useMemo } from "react";
import {
  ArrowCircleRight,
  ChatCenteredDots,
  Stack,
  GitBranch,
  Link,
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabaseClient";
import StarButton from "@/components/star-button";
import { useRouter } from "next/navigation";
import MobileWarningBanner from "@/components/MobileWarningBanner";
import "./search.css"
import Popup from "@/components/Popup/Popup";

const BASE_URL_BACKEND = "https://api.amurex.ai";

// 3. Home component
export default function AISearch() {
  // Initialize ldrs in a useEffect instead
  useEffect(() => {
    // Dynamically import ldrs only on the client side
    import('ldrs').then(({ ring }) => {
      ring.register();
    });
  }, []);

  // 4. Initialize states and refs
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [session, setSession] = useState(null);
  const [searchResults, setSearchResults] = useState({
    /* query: "asdfasdfasdf query",
    sources: [
      {
        "source": "email",
        "id": 102349,
        "title": "Вы пропустили сообщения на сервере 11 \"Б\"",
        "content": "У вас 3 новых сообщений 11 &quot;Б&quot; Показать сообщения Нужна помощь? Свяжитесь с командой поддержки или напишите нам в X @discord. Хотите оставить отзыв? Дайте нам знать, что вы думаете на сайте",
        "url": "https://mail.google.com/mail/u/0/#inbox/196787ba0976d5ad",
        "similarity": 0.6216198342952016,
        "text_rank": null,
        "hybrid_score": null,
        "type": "gmail"
      },
      {
        "source": "email",
        "id": 102345,
        "title": "srhoe упомянул вас в OwlSec",
        "content": "У вас 5+ новых сообщений 📢・announcement Показать сообщения 11 &quot;Б&quot; Показать сообщения Нужна помощь? Свяжитесь с командой поддержки или напишите нам в X @discord. Хотите оставить отзыв? Дайте",
        "url": "https://mail.google.com/mail/u/0/#inbox/1967da9efd1abc0e",
        "similarity": 0.612551144375464,
        "text_rank": null,
        "hybrid_score": null,
        "type": "gmail"
      },
      {
        "source": "email",
        "id": 102342,
        "title": "srhoe упомянул вас в OwlSec",
        "content": "У вас 1 новое сообщение #💬・chat (OwlSec) Показать сообщения Нужна помощь? Свяжитесь с командой поддержки или напишите нам в X @discord. Хотите оставить отзыв? Дайте нам знать, что вы думаете на сайте",
        "url": "https://mail.google.com/mail/u/0/#inbox/19682fadd97163bc",
        "similarity": 0.612551144375464,
        "text_rank": null,
        "hybrid_score": null,
        "type": "gmail"
      }
    ],
    vectorResults: [],
    answer: "Ваще хз как помочь тебе", */
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchInitiated, setIsSearchInitiated] = useState(false); // gotta be false
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [searchStartTime, setSearchStartTime] = useState(null);
  const [sourcesTime, setSourcesTime] = useState(null);
  const [completionTime, setCompletionTime] = useState(null);
  const [isSidebarOpened, setIsSidebarOpened] = useState(true);
  const [sidebarSessions, setSidebarSessions] = useState([]);
  const [isWaitingSessions, setIsWaitingSessions] = useState(true);
  const [currentThread, setCurrentThread] = useState([]);  // Initialize as empty array
  const [currentThreadId, setCurrentThreadId] = useState("")
  const [isDeletionConfirmationPopupOpened, setIsDeletionConfirmationPopupOpened] = useState(false);
  const [deletionConfirmation, setDeletionConfirmation] = useState({
    deletingThread: {
      title: "None"
    },
    isWaiting: false,
    error: ""
  })

  // Add source filter states - these are only for frontend filtering
  const [showGoogleDocs, setShowGoogleDocs] = useState(true);
  const [showNotion, setShowNotion] = useState(true);
  const [showMeetings, setShowMeetings] = useState(true);
  const [showObsidian, setShowObsidian] = useState(true);
  const [showGmail, setShowGmail] = useState(true);

  // Connection status states
  const [hasGoogleDocs, setHasGoogleDocs] = useState(false);
  const [hasMeetings, setHasMeetings] = useState(false);
  const [hasNotion, setHasNotion] = useState(false);
  const [hasObsidian, setHasObsidian] = useState(false);
  const [hasGmail, setHasGmail] = useState(false);
  const [googleTokenVersion, setGoogleTokenVersion] = useState(null);

  // Modal states
  const [showGoogleDocsModal, setShowGoogleDocsModal] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [showBroaderAccessModal, setShowBroaderAccessModal] = useState(false);
  const [isGoogleAuthInProgress, setIsGoogleAuthInProgress] = useState(false);

  // Add useRouter
  const router = useRouter();

  // Auto scroll to the end of the messages
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [messageHistory]);

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

    const handleInserts = (payload) => {
      if (payload.new.user_id !== session.user.id) return;

      setMessageHistory((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        const isSameType =
          lastMessage?.payload?.type === "GPT" &&
          payload.new.payload.type === "GPT";
        return isSameType
          ? [...prevMessages.slice(0, -1), payload.new]
          : [...prevMessages, payload.new];
      });
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
        handleInserts
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to message_history');
        } else if (status === 'CLOSED') {
          console.log('Channel closed, attempting to resubscribe...');
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
        error ? console.log("error", error) : setMessageHistory(message_history)
      );

    // fetching user's sessions
    const fetchUserThreads = async () => {
      if (!session?.user?.id) return;

      try {
        const { data, error } = await supabase
          .from('threads')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching threads:', error);
          return;
        }

        console.log(data)

        setSidebarSessions(data);
        setIsWaitingSessions(false);
      } catch (err) {
        setIsWaitingSessions(false);
        console.error('Unexpected error:', err);
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
        setHasGoogleDocs(googleConnected && data?.google_token_version === "full");

        // Gmail is available with either "full" or "gmail_only" access
        setHasGmail(googleConnected &&
          (data?.google_token_version === "full" || data?.google_token_version === "gmail_only"));

        connectionsChecked++;
        if (connectionsChecked === 2) {
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
        if (connectionsChecked === 2) {
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
    const checkOnboarding = (google, notion) => {
      if (!google && !notion && !hasSeenOnboarding) {
        setShowOnboarding(true);
      }
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
        const response = await fetch("/api/search", {
          method: "POST",
          body: JSON.stringify({
            documents: data,
            user_id: session.user.id,
            type: "prompts", // Add type to differentiate the request
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Error generating prompts");
          return;
        }

        const { prompts } = await response.json();
        setSuggestedPrompts(prompts.prompts); // Access the nested prompts array
      });
  }, [session?.user?.id]);

  // Update sendMessage to use search_new directly
  const sendMessage = async (messageToSend) => {
    if (!session?.user?.id) return;

    const message = messageToSend || inputValue;

    setCurrentThread(prev => [
      ...prev,
      {
        query: message,
        sources: [],
        vectorResults: [],
        answer: "",
      }
    ])

    if (!message.trim()) return

    let threadId = ""

    try {
      console.log(sidebarSessions.some(session => {
        console.log(session)
        console.log(session.id)
        console.log(currentThreadId)
      }))
      if (!sidebarSessions.some(session => session.id === currentThreadId)) {
        console.log("creating new thread")
        // creating a new thread
        const { data: threadData, error: threadError } = await supabase
          .from('threads')
          .insert([{
            user_id: session.user.id,
            title: message.slice(0, 50) // use first 50 chars as title
          }])
          .select()
          .single();

        if (threadError) {
          console.error('Error creating thread:', threadError);
          return;
        }

        threadId = threadData.id;
        setCurrentThreadId(threadData.id)  // Fix: Set the ID to currentThreadId instead of currentThread
      } else {
        threadId = currentThreadId;
      }

      /* // adding user's message
      const { error: messageError } = await supabase
        .from('messages')
        .insert([{
          thread_id: threadId,
          role: 'user',
          content: message
        }]);


      if (messageError) {
        console.error('Error adding message:', messageError);
        return;
      } */

      console.log('✅ Message sent & thread created!');
    } catch (err) {
      console.error('Unexpected error:', err);
    }


    setInputValue("");
    setIsSearching(true);
    setIsSearchInitiated(true);

    // Reset all timing metrics
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

    const transformedMessages = currentThread.flatMap(item => {
      const result = [];
      if (item.query) {
        result.push({ role: 'user', content: item.query });
      }
      if (item.reply) {
        result.push({
          role: 'assistant', content: `${item.reply}
          
sources: ${JSON.stringify(item.sources)}`
        });
      }
      return result;
    });

    console.log(transformedMessages)

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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let sourcesReceived = false;
        let firstChunkReceived = false;


        let finalAnswer = "";
        let finalSources = [];


        function readStream() {
          reader
            .read()
            .then(async ({ done, value }) => {
              if (done) {
                // Record final completion time when stream ends
                const endTime = performance.now();
                let completionTimeLocal = ((endTime - startTime) / 1000).toFixed(1) // added "local" just to avoid collision with another var (gotta delete another var in the future)
                setCompletionTime(((endTime - startTime) / 1000).toFixed(1));

                setIsSearching(false);
                console.log("done")

                // writing results as the last element of currentThread
                setCurrentThread(prev => prev.map((item, index) => {
                  console.log(item)
                  if (index == currentThread.length) {
                    return {
                      ...item,
                      sources: finalSources,
                      reply: finalAnswer,
                      completionTime: completionTimeLocal
                    }
                  }

                  return item
                })
                )


                if (!sidebarSessions.some(session => session.id === currentThreadId)) {
                  setSidebarSessions(prev => [{ title: message, id: threadId }, ...prev])
                }

                try {
                  console.log(message)
                  console.log({
                    thread_id: threadId,
                    query: message,
                    reply: finalAnswer,
                    sources: JSON.stringify(finalSources),
                    completion_time: parseFloat(completionTimeLocal)
                  })
                  const { error: messageError } = await supabase
                    .from('messages')
                    .insert([{
                      thread_id: threadId,
                      query: message,
                      reply: finalAnswer,
                      sources: JSON.stringify(finalSources),
                      completion_time: parseFloat(completionTimeLocal)
                    }]);
                  if (messageError) {
                    console.error('Error adding message:', messageError);
                    return;
                  }
                } catch (e) {
                  console.error("Failed to upload assistant response:", e)
                }


                return;
              }

              buffer += decoder.decode(value, { stream: true });

              try {
                // Split by newlines and filter out empty lines
                const lines = buffer.split("\n").filter((line) => line.trim());

                // Process each complete line
                for (let i = 0; i < lines.length; i++) {
                  try {
                    const data = JSON.parse(lines[i]);

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
                          ((currentTime - startTime) / 1000).toFixed(1)
                        );
                      }

                      // Track when first text chunk arrives
                      if (data.chunk && !firstChunkReceived) {
                        firstChunkReceived = true;
                        // If we get a large chunk at once (from Brain API), record completion time
                        if (data.chunk.length > 200) {
                          const currentTime = performance.now();
                          setCompletionTime(((currentTime - startTime) / 1000).toFixed(1));
                        }
                      }

                      if (data.chunk) {
                        finalAnswer += data.chunk;
                      }

                      if (data.sources && data.sources.length > 0) {
                        finalSources = data.sources;
                      }

                      setSearchResults((prev) => ({
                        ...prev,
                        sources: data.sources || prev.sources,
                        answer: prev.answer + (data.chunk || ""),
                        done: data.done || false,
                      }));
                      console.log(data.sources || prev.sources)
                    }
                  } catch (e) {
                    console.error("Error parsing JSON:", e, "Line:", lines[i]);
                  }
                }


                // Keep only the incomplete line in the buffer
                const lastNewlineIndex = buffer.lastIndexOf("\n");
                if (lastNewlineIndex !== -1) {
                  buffer = buffer.substring(lastNewlineIndex + 1);
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
      })
      .catch((err) => {
        console.error("Error:", err);
        setIsSearching(false);
      });

  };

  const openThread = async (threadId) => {
    console.log("opening thread" + threadId)
    if (!threadId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching threads:', error);
        return;
      }

      const transformedData = data.map(({ completion_time, sources, ...rest }) => ({
        ...rest,
        completionTime: completion_time,
        sources: JSON.parse(sources)
      }));
      console.log(transformedData)

      setCurrentThreadId(threadId)
      setCurrentThread(transformedData)
      setIsSearchInitiated(true)

    } catch (err) {
      setIsWaitingSessions(false);
      console.error('Unexpected error:', err);
    }
  }

  const deleteThread = async () => {
    console.log(`Deleting: ${deletionConfirmation?.deletingThread}`)
    console.log(deletionConfirmation?.deletingThread)
    try {
      
      if (deletionConfirmation?.deletingThread) {
        const threadId = deletionConfirmation?.deletingThread?.id 
        setDeletionConfirmation(prev => ({
          ...prev,
          isWaiting: true,
          error: ""
        }))

        // Delete thread from DB
        const { error } = await supabase
          .from("threads")
          .delete()
          .eq("id", threadId);

        if (error) {
          console.error("Error deleting thread:", error.message);
          setDeletionConfirmation(prev => ({
            ...prev,
            isWaiting: false,
            error: "Failed to delete thread from server"
          }));
          return;
        }

        // Remove from client-side list
        setSidebarSessions(prev =>
          prev.filter(session => session.id !== threadId)
        );

        setIsDeletionConfirmationPopupOpened(false)
        setTimeout(() => {
          setDeletionConfirmation({
            deletingThread: {
              title: "None"
            },
            isWaiting: false,
            error: ""
          })
        }, 400);



      }
    } catch (e) {
      console.log(e)
      setDeletionConfirmation(prev => ({
        ...prev,
        isWaiting: false,
        error: "Something went wrong, please try again later"
      }))
    }
  }

  // Add function to initiate Google auth
  const initiateGoogleAuth = async () => {
    try {
      setIsGoogleAuthInProgress(true);

      // Call the Google auth API directly
      const response = await fetch('/api/google/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          source: 'search',
          upgradeToFull: true
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect to Google auth URL
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get Google auth URL');
      }
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      setIsGoogleAuthInProgress(false);
    }
  };

  // Function to handle Google Docs button click
  const handleGoogleDocsClick = () => {
    // Toggle visibility regardless of connection status
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
  };

  // Function to handle Gmail button click
  const handleGmailClick = () => {
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
  };

  // Function to handle Notion button click
  const handleNotionClick = () => {
    // Toggle visibility regardless of connection status
    setShowNotion(!showNotion);

    // If not connected, redirect to settings
    if (!hasNotion) {
      window.location.href = "/settings?tab=personalization";
    }
  };

  // Function to handle Obsidian button click
  const handleObsidianClick = () => {
    // Toggle visibility regardless of connection status
    setShowObsidian(!showObsidian);

    // If not connected, redirect to settings
    if (!hasObsidian) {
      window.location.href = "/settings?tab=personalization";
    }
  };

  // Function to handle Meetings button click
  const handleMeetingsClick = () => {
    // Toggle visibility (no connection needed)
    setShowMeetings(!showMeetings);
  };

  // 12. Render home component
  return (
    <>
      <MobileWarningBanner />
      <div
        className={`min-h-screen bg-black ${isSearchInitiated ? "" : ""
          }`}
      // className={"min-h-screen bg-black pt-6 flex items-center justify-center"}
      >

        <Popup isPopupOpened={isDeletionConfirmationPopupOpened} setIsPopupOpened={setIsDeletionConfirmationPopupOpened} forbidClosing={deletionConfirmation?.isWaiting}>
          <h3 className="popupTitle">Deleting thread &quot;{deletionConfirmation?.deletingThread?.title}&quot;?</h3>
          <p className="popupSubtitle">
            Are you sure you want to delete thread with name &quot;{deletionConfirmation?.deletingThread?.title}&quot;?
          </p>

          <p className="errorMessage">{deletionConfirmation?.error}</p>

          <div className="popupConfirmationButtons">
            <button className="fileMutationButton" onClick={() => setIsDeletionConfirmationPopupOpened(false)} disabled={deletionConfirmation?.isWaiting}>
              Cancel
            </button>
            <button className="fileMutationButtonHighlight" onClick={deleteThread} disabled={deletionConfirmation?.isWaiting}>
              {deletionConfirmation?.isWaiting ? (
                <>
                  <span>Deleting...</span>
                  <l-tail-chase
                    size="26"
                    speed="1.75"
                    color="white"
                  ></l-tail-chase>
                </>
              ) : "Delete"}
            </button>
          </div>

        </Popup>

        <div className="fixed top-4 right-4 z-50 hidden">
          <StarButton />
        </div>
        {showOnboarding && (
          <OnboardingFlow
            onClose={() => setShowOnboarding(false)}
            setHasSeenOnboarding={setHasSeenOnboarding}
          />
        )}
        <div className="content">

          {!showOnboarding && (
            <div className="hidden bg-[#1E1E24] rounded-lg border border-zinc-800 p-4 mb-4 flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <div className="bg-[#9334E9] rounded-full p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <p className="text-zinc-300">
                  Connect your Google Docs, Notion, or upload Obsidian files to get the most out of Amurex
                </p>
              </div>
              <a
                href="/settings?tab=personalization"
                className="inline-flex items-center justify-center px-4 py-2 bg-[#9334E9] text-white rounded-lg hover:bg-[#7928CA] transition-colors"
              >
                Connect Accounts
              </a>
            </div>
          )}


          <div className={`sidebar ${isSidebarOpened ? 'sidebarActive' : ''}`}>
            <div
              className={`sidebarIcon ${isSidebarOpened ? 'sidebarIconActive' : ''}`}
              onClick={() => setIsSidebarOpened(prev => !prev)}
            >
              <span className="sidebarIconTop"></span>
              <span className="sidebarIconMiddle"></span>
              <span className="sidebarIconBottom"></span>
            </div>
            {/* <h3 className="sidebarTitle">Your sessions:</h3> */}
            <h2 className="text-2xl font-medium text-white mb-6">Knowledge Search</h2>
            <div className="sidebarItems no-scrollbar">
              {isWaitingSessions && (
                <div className="sidebarLoader">
                  <l-ring
                    size="55"
                    stroke="5"
                    bg-opacity="0"
                    speed="2"
                    color="white"
                  ></l-ring>
                </div>
              )}
              {!!sidebarSessions.length && (
                <>
                  <div className="sidebarItem" onClick={() => {
                    setIsSearchInitiated(false);
                    setCurrentThread([])
                    setCurrentThreadId("")
                  }}>
                    <img src="/plus.png" alt="New session" className="w-4 h-4 mr-2 inline-block" />
                    New search
                  </div>
                  {sidebarSessions?.map((session, index) => (
                    <div className={`sidebarItem ${session.id == currentThreadId ? "sidebarItemActive" : ""}`} key={session.id + index} onClick={() => openThread(session.id)}>
                      {session.title}
                      <img src="/delete.png" alt="" className="deleteIcon" onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDeletionConfirmationPopupOpened(true);
                        setDeletionConfirmation(prev => ({
                          ...prev,
                          deletingThread: session
                        }))
                      }} />
                    </div>
                  ))}
                </>
              )}


              {!isWaitingSessions && !sidebarSessions?.length && (
                <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 tracking-wide">
                  No sessions so far...
                </p>
              )}
            </div>
          </div>


          <div className={`chat ${isSidebarOpened ? '' : "chatSidebarClosed"}`}>
            <div className="chatContent no-scrollbar">
              <h2 className="hidden text-2xl font-medium text-white mb-4">Knowledge Search</h2>
              <div className="bg-zinc-900/70 rounded-lg border border-zinc-800 relative">
                <div className="p-4 md:p-6 border-b border-zinc-800">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-[#9334E9]">
                        <ChatCenteredDots className="h-5 w-5" />
                      </div>
                      <h1 className="text-xl md:text-2xl font-medium text-white">
                        Search your knowledge
                      </h1>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-2">
                        {/* Google Docs button */}
                        {hasGoogleDocs ? (
                          <button
                            onClick={handleGoogleDocsClick}
                            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 ${showGoogleDocs
                              ? "bg-[#3c1671] text-white border-[#6D28D9]"
                              : "bg-zinc-900 text-white"
                              } transition-all duration-200 hover:border-[#6D28D9]`}
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                              alt="Google Docs"
                              className="w-4 h-4"
                            />
                            <span>Google Docs</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleGoogleDocsClick}
                            className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                              alt="Google Docs"
                              className="w-4 h-4"
                            />
                            <span>Google Docs</span>
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              Connect Google Docs
                            </span>
                          </button>
                        )}

                        {/* Notion button */}
                        {hasNotion ? (
                          <button
                            onClick={handleNotionClick}
                            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 ${showNotion
                              ? "bg-[#3c1671] text-white border-[#6D28D9]"
                              : "bg-zinc-900 text-white"
                              } transition-all duration-200 hover:border-[#6D28D9]`}
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                              alt="Notion"
                              className="w-4"
                            />
                            <span>Notion</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleNotionClick}
                            className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                              alt="Notion"
                              className="w-4"
                            />
                            <span>Notion</span>
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              Connect Notion
                            </span>
                          </button>
                        )}

                        {/* Obsidian button */}
                        {hasObsidian ? (
                          <button
                            onClick={handleObsidianClick}
                            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 ${showObsidian
                              ? "bg-[#3c1671] text-white border-[#6D28D9]"
                              : "bg-zinc-900 text-white"
                              } transition-all duration-200 hover:border-[#6D28D9]`}
                          >
                            <img
                              src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                              alt="Obsidian"
                              className="w-4"
                            />
                            <span>Obsidian</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleObsidianClick}
                            className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
                          >
                            <img
                              src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                              alt="Obsidian"
                              className="w-4"
                            />
                            <span>Obsidian</span>
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              Upload Obsidian Files
                            </span>
                          </button>
                        )}

                        {/* Meetings button */}
                        <button
                          onClick={handleMeetingsClick}
                          className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 ${showMeetings && hasMeetings
                            ? "bg-[#3c1671] text-white border-[#6D28D9]"
                            : "bg-zinc-900 text-white"
                            } transition-all duration-200 hover:border-[#6D28D9] ${!hasMeetings ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          disabled={!hasMeetings}
                        >
                          <ChatCenteredDots className="w-4 h-4" />
                          <span>Meetings</span>
                          {!hasMeetings && (
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              No meetings found
                            </span>
                          )}
                        </button>

                        {/* Gmail button */}
                        {hasGmail ? (
                          <button
                            onClick={handleGmailClick}
                            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 ${showGmail
                              ? "bg-[#3c1671] text-white border-[#6D28D9]"
                              : "bg-zinc-900 text-white"
                              } transition-all duration-200 hover:border-[#6D28D9]`}
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                              alt="Gmail"
                              className="w-4"
                            />
                            <span>Gmail</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleGmailClick}
                            className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative"
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                              alt="Gmail"
                              className="w-4"
                            />
                            <span>Gmail</span>
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                              Connect Gmail
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-6 space-y-6">
                  <div className="w-full">
                    <InputArea
                      inputValue={inputValue}
                      setInputValue={setInputValue}
                      sendMessage={sendMessage}
                      className={`w-full ${isSearchInitiated && "hidden"}`}
                    />
                  </div>

                  <div>
                    {currentThread?.map((question, index) => (
                      <div className="space-y-6 threadItem" key={index}>
                        <Query
                          content={question?.query || ""}
                          sourcesTime={sourcesTime}
                          completionTime={question.completionTime}
                        />

                        {/* "grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6" */}
                        <div className="answer">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              {/* <Heading content="Answer" /> */}
                              {/* {!isSearching && searchResults?.query && (
                            <button
                              onClick={() => sendMessage(searchResults.query)}
                              className="flex items-center gap-1 text-sm text-zinc-300 hover:text-white bg-black border border-zinc-800 hover:border-[#6D28D9] px-3 py-1.5 rounded-md transition-colors"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 489.645 489.645"
                                fill="currentColor"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M460.656,132.911c-58.7-122.1-212.2-166.5-331.8-104.1c-9.4,5.2-13.5,16.6-8.3,27c5.2,9.4,16.6,13.5,27,8.3
                              c99.9-52,227.4-14.9,276.7,86.3c65.4,134.3-19,236.7-87.4,274.6c-93.1,51.7-211.2,17.4-267.6-70.7l69.3,14.5
                              c10.4,2.1,21.8-4.2,23.9-15.6c2.1-10.4-4.2-21.8-15.6-23.9l-122.8-25c-20.6-2-25,16.6-23.9,22.9l15.6,123.8
                              c1,10.4,9.4,17.7,19.8,17.7c12.8,0,20.8-12.5,19.8-23.9l-6-50.5c57.4,70.8,170.3,131.2,307.4,68.2
                              C414.856,432.511,548.256,314.811,460.656,132.911z"
                                />
                              </svg>
                              Regenerate
                            </button>
                          )} */}
                            </div>
                            <div className="bg-black rounded-lg p-4 border border-zinc-800 text-zinc-300">
                              <GPT content={question?.reply || ""} />
                              {!question?.reply?.length && (
                                <span className="inline-block animate-pulse">▋</span>
                              )}
                            </div>
                          </div>

                          {question?.sources?.length > 0 && (
                            <div>
                              <Sources content={question.sources} filters={{ showGoogleDocs, showNotion, showMeetings, showObsidian, showGmail }} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>



                  {(isSearching || searchResults?.query) && false && (
                    <div className="space-y-6">
                      <Query
                        content={searchResults?.query || ""}
                        sourcesTime={sourcesTime}
                        completionTime={completionTime}
                      />

                      {/* "grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6" */}
                      <div className="answer">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            {/* <Heading content="Answer" /> */}
                            {/* {!isSearching && searchResults?.query && (
                              <button
                                onClick={() => sendMessage(searchResults.query)}
                                className="flex items-center gap-1 text-sm text-zinc-300 hover:text-white bg-black border border-zinc-800 hover:border-[#6D28D9] px-3 py-1.5 rounded-md transition-colors"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 489.645 489.645"
                                  fill="currentColor"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M460.656,132.911c-58.7-122.1-212.2-166.5-331.8-104.1c-9.4,5.2-13.5,16.6-8.3,27c5.2,9.4,16.6,13.5,27,8.3
                                c99.9-52,227.4-14.9,276.7,86.3c65.4,134.3-19,236.7-87.4,274.6c-93.1,51.7-211.2,17.4-267.6-70.7l69.3,14.5
                                c10.4,2.1,21.8-4.2,23.9-15.6c2.1-10.4-4.2-21.8-15.6-23.9l-122.8-25c-20.6-2-25,16.6-23.9,22.9l15.6,123.8
                                c1,10.4,9.4,17.7,19.8,17.7c12.8,0,20.8-12.5,19.8-23.9l-6-50.5c57.4,70.8,170.3,131.2,307.4,68.2
                                C414.856,432.511,548.256,314.811,460.656,132.911z"
                                  />
                                </svg>
                                Regenerate
                              </button>
                            )} */}
                          </div>
                          <div className="bg-black rounded-lg p-4 border border-zinc-800 text-zinc-300">
                            <GPT content={searchResults?.reply || ""} />
                            {isSearching && (
                              <span className="inline-block animate-pulse">▋</span>
                            )}
                          </div>
                        </div>

                        {searchResults?.sources?.length > 0 && (
                          <div>
                            <Sources content={searchResults.sources} filters={{ showGoogleDocs, showNotion, showMeetings, showObsidian, showGmail }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}


                </div>
              </div>

              {/* Suggested prompts moved outside the main box */}
              {!isSearchInitiated && (
                <div className="mt-6 space-y-2">
                  <div className="text-zinc-500 text-md">Personalized prompt suggestions</div>
                  <div className="flex flex-col gap-3">
                    {suggestedPrompts.length === 0 ? (
                      <>
                        {[1, 2, 3].map((_, index) => (
                          <div
                            key={index}
                            className="transition-all duration-500 w-[70%] px-4 py-4 pr-16 rounded-lg bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors text-lg text-left relative group animated pulse"
                          >
                            <div className="h-4 bg-zinc-800 rounded w-3/4 m-4"></div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        {/* Regular prompts */}
                        {suggestedPrompts
                          .filter((item) => item.type === "prompt")
                          .map((item, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setInputValue(item.text);
                                sendMessage(item.text);
                              }}
                              className="transition-all duration-500 w-[70%] px-4 py-4 pr-16 rounded-lg bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors text-lg text-left relative group"
                            >
                              {item.text}
                              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-white"
                                >
                                  <path d="M3 12h18"></path>
                                  <path d="m16 5 7 7-7 7"></path>
                                </svg>
                              </div>
                            </button>
                          ))}
                        {/* Email actions */}
                        {suggestedPrompts
                          .filter((item) => item.type === "email")
                          .map((item, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setInputValue(item.text);
                                sendMessage(item.text);
                              }}
                              className="transition-all duration-500 w-[70%] px-4 py-4 pr-16 rounded-lg bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors text-lg text-left relative group"
                            >
                              <span>{item.text}</span>
                              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-white"
                                >
                                  <path d="M3 12h18"></path>
                                  <path d="m16 5 7 7-7 7"></path>
                                </svg>
                              </div>
                            </button>
                          ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="followUpInputArea">
              <InputArea
                inputValue={inputValue}
                setInputValue={setInputValue}
                sendMessage={sendMessage}
                className={`w-full ${!isSearchInitiated && "hidden"}`}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Google Docs Modal */}
      {showGoogleDocsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-700">
            <h3 className="text-xl font-medium text-white mb-4">Google Access Required</h3>
            <p className="text-zinc-300 mb-6">
              {googleTokenVersion === "old"
                ? "Your Google access token is old and you'll have to reconnect Google to continue using it."
                : "You need to connect your Google account to access Google Docs. Please visit the settings page to connect."}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowGoogleDocsModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <a
                href="/settings?tab=personalization"
                className="px-4 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#7928CA] transition-colors"
              >
                Go to Settings
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Broader Access Modal */}
      {showBroaderAccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-700">
            <h3 className="text-xl font-medium text-white mb-4">Broader Google Access Required</h3>
            <p className="text-zinc-300 mb-6">
              We need broader access to your Google account to enable Google Docs search. Our app is still in the verification process with Google. If you wish to proceed with full access, please click the button below.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowBroaderAccessModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                disabled={isGoogleAuthInProgress}
              >
                Cancel
              </button>
              <button
                onClick={initiateGoogleAuth}
                className="px-4 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#7928CA] transition-colors flex items-center justify-center"
                disabled={isGoogleAuthInProgress}
              >
                {isGoogleAuthInProgress ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  "Connect Google"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gmail Modal */}
      {showGmailModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-700">
            <h3 className="text-xl font-medium text-white mb-4">Google Access Required</h3>
            <p className="text-zinc-300 mb-6">
              {googleTokenVersion === "old"
                ? "Your Google access token is old and you'll have to reconnect Google to continue using it."
                : "You need to connect your Google account to access Gmail. Please visit the settings page to connect."}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowGmailModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <a
                href="/settings?tab=personalization"
                className="px-4 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#7928CA] transition-colors"
              >
                Go to Settings
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
/* 17. Export InputArea component */
export function InputArea({
  inputValue,
  setInputValue,
  sendMessage,
  className = "",
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex-1 flex items-center">
        <div className="absolute left-3 md:left-4 text-zinc-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search anything..."
          className="flex-1 p-3 md:p-4 pl-10 md:pl-12 text-sm md:text-base rounded-l-lg focus:outline-none bg-black border border-zinc-800 text-zinc-300 focus:border-[#6D28D9] transition-colors"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
      </div>
      <button
        onClick={() => sendMessage()}
        className="p-3 md:p-4 rounded-r-lg bg-black border-t border-r border-b border-zinc-800 text-zinc-300 hover:bg-[#3c1671] transition-colors"
      >
        <ArrowCircleRight size={20} className="md:w-6 md:h-6" />
      </button>
    </div>
  );
}
/* 21. Query component for displaying content */
export const Query = ({ content = "", sourcesTime, completionTime }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between">
      <div className="text-xl md:text-3xl font-medium text-white">
        {content}
      </div>
      <div className="text-sm text-zinc-500 mt-1 md:mt-0 flex flex-col md:items-end">
        {completionTime && (
          <div className="px-2 py-1 rounded-md bg-[#9334E9] text-white w-fit">
            Searched in {completionTime} seconds
          </div>
        )}
      </div>
    </div>
  );
};
/* 22. Sources component for displaying list of sources */
export const Sources = ({ content = [], filters = {} }) => {
  // Filter sources based on filter settings
  const filteredSources = useMemo(() => {
    if (!content || !Array.isArray(content)) return [];

    return content.filter(source => {
      const sourceType = source.type;

      // Apply filters based on source type
      if (sourceType === 'google_docs' && !filters.showGoogleDocs) return false;
      if (sourceType === 'notion' && !filters.showNotion) return false;
      if ((sourceType === 'msteams' || sourceType === 'google_meet') && !filters.showMeetings) return false;
      if (sourceType === 'obsidian' && !filters.showObsidian) return false;
      if ((sourceType === 'gmail' || sourceType === 'email') && !filters.showGmail) return false;

      // Include sources with unknown types
      return true;
    });
  }, [content, filters]);

  // Helper function to determine source icon based on 'type' directly
  const getSourceIcon = (type) => {
    switch (type) {
      case "gmail":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="w-6 flex-shrink-0"
          />
        );

      case "msteams":
        return (
          <img
            src="https://www.svgrepo.com/show/303180/microsoft-teams-logo.svg"
            alt="Microsoft Teams"
            className="w-8"
          />
        );

      case "google_meet":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Google_Meet_icon_%282020%29.svg/1024px-Google_Meet_icon_%282020%29.svg.png?20221213135236"
            alt="Google Meet"
            className="w-8"
          />
        );

      case "google_docs":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
            alt="Google Docs"
            className="w-6 h-6"
          />
        );

      case "notion":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
            alt="Notion"
            className="w-6 h-6"
          />
        );

      case "obsidian":
        return (
          <img
            src="https://obsidian.md/images/obsidian-logo-gradient.svg"
            alt="Obsidian"
            className="w-6 h-6"
          />
        );

      case "email":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="w-6 flex-shrink-0"
          />
        );

      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-zinc-400"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
    }
  };

  if (!content || content?.length === 0) {
    return (
      <div>
        <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
          {/* <GitBranch size={20} className="md:w-6 md:h-6" /> */}
          {/* <span>Sources</span> */}
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((_, index) => (
            <div
              key={index}
              className="bg-black rounded-lg p-4 border border-zinc-800"
            >
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show message when all sources are filtered out
  /* if (filteredSources.length === 0 && content.length > 0) {
    return (
      <div>
        <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
          <GitBranch size={20} className="md:w-6 md:h-6" />
          <span>Sources</span>
        </div>
        <div className="bg-black rounded-lg p-4 border border-zinc-800 text-zinc-400 text-center">
          <p>All sources are filtered out. Enable source types to see results.</p>
        </div>
      </div>
    );
  } */

  return (
    <div>{/*  */}
      <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
        {/* <GitBranch size={20} className="md:w-6 md:h-6" /> */}
        {/* <span>Sources</span> */}
      </div>
      <div className="sourceItems no-scrollbar">
        {Array.isArray(filteredSources) &&
          filteredSources.map((source, index) => {
            return (
              <a
                key={index}
                href={source.url || "#"}
                className="block sourceItem"
                target="_blank"
                rel="noopener noreferrer"
              >{/* bg-black rounded-lg p-4 border border-zinc-800 hover:border-[#6D28D9] transition-colors h-[160px] relative */}
                <div className="">
                  <Link className="absolute top-4 right-4 w-4 h-4 text-zinc-500" />
                  <div className="text-zinc-300 text-sm font-medium mb-2 flex items-center gap-2">
                    {getSourceIcon(source.type)}
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-medium max-w-full">
                        {source.type || "Service"}

                      </span>

                      {/* Show sender if available (for email types) */}
                      {source.sender && (
                        <span className="text-xs text-zinc-400 truncate max-w-full">
                          {source.sender}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-zinc-500 text-sm overflow-hidden line-clamp-4">
                    <ReactMarkdown>{/* {source.content || ""} */}{source.title || "Document"}</ReactMarkdown>
                  </div>
                </div>
              </a>
            );
          })}
      </div>
    </div>
  );
};
// 27. VectorCreation component for displaying a brief message
export const VectorCreation = ({ content = "" }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return visible ? (
    <div className="w-full p-1">
      <span className="flex flex-col items-center py-2 px-6 bg-white rounded shadow hover:shadow-lg transition-shadow duration-300 h-full tile-animation">
        <span>{content}</span>
      </span>
    </div>
  ) : null;
};
// 28. Heading component for displaying various headings
export const Heading = ({ content = "" }) => {
  return (
    <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
      <ChatCenteredDots size={20} className="md:w-6 md:h-6" />
      <span>{content}</span>
    </div>
  );
};

// Move these utility functions outside of any component
const fetchSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    router.push("/web_app/signin");
    return null;
  }
  return session;
};

const logUserAction = async (userId, eventType) => {
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
};

// 30. GPT component for rendering markdown content
const GPT = ({ content = "" }) => {
  const [showEmailButton, setShowEmailButton] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    // Reset states when content changes
    setShowEmailButton(false);
    setIsComplete(false);

    // Check if it's an email response
    if (
      content.toLowerCase().includes("subject:") ||
      content.toLowerCase().includes("dear ")
    ) {
      setShowEmailButton(true);
    }

    // Auto-scroll as content is generated
    if (contentRef.current) {
      contentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [content]);

  // Set complete when the streaming is done
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!content.endsWith("▋")) {
        setIsComplete(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  const openGmail = async () => {
    // In any component:
    const session = await fetchSession();
    await logUserAction(session.user.id, "web_open_email_in_gmail");

    const cleanContent = content
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n\n+/g, "\n\n")
      .replace(/\n/g, "%0A")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/%0A\s+/g, "%0A")
      .replace(/%0A%0A+/g, "%0A%0A");

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&body=${cleanContent}`;
    window.open(gmailUrl, "_blank");
  };

  return (
    <div ref={contentRef}>
      <ReactMarkdown
        className="prose text-base md:text-xl mt-1 w-full break-words prose-p:leading-relaxed prose-p:mb-4"
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-[#9334E9] font-medium hover:text-[#7928CA] underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            />
          ),
          p: ({ node, ...props }) => <p className="mb-4" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>

      {showEmailButton && isComplete && (
        <button
          onClick={openGmail}
          className="mt-4 px-4 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#7928CA] transition-colors flex items-center gap-2"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="h-4"
          />
          Open in Gmail
        </button>
      )}
    </div>
  );
};
// 31. FollowUp component for displaying follow-up options
export const FollowUp = ({ content = "", sendMessage = () => { } }) => {
  const [followUp, setFollowUp] = useState([]);
  const messagesEndReff = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      messagesEndReff.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [followUp]);

  useEffect(() => {
    if (
      typeof content === "string" &&
      content[0] === "{" &&
      content[content.length - 1] === "}"
    ) {
      try {
        const parsed = JSON.parse(content);
        setFollowUp(Array.isArray(parsed.follow_up) ? parsed.follow_up : []);
      } catch (error) {
        console.log("error parsing json", error);
        setFollowUp([]);
      }
    }
  }, [content]);

  const handleFollowUpClick = (text, e) => {
    e.preventDefault();
    if (text) sendMessage(text);
  };

  return (
    <>
      {followUp.length > 0 && (
        <div className="text-3xl font-bold my-4 w-full flex">
          <Stack size={32} /> <span className="px-2">Follow-Up</span>
        </div>
      )}
      {followUp.map((text, index) => (
        <a
          href="#"
          key={index}
          className="text-xl w-full p-1"
          onClick={(e) => handleFollowUpClick(text, e)}
        >
          <span>{text || ""}</span>
        </a>
      ))}
      <div ref={messagesEndReff} />
    </>
  );
};
// 40. MessageHandler component for dynamically rendering message components
const MessageHandler = memo(
  ({ message = { type: "", content: "" }, sendMessage = () => { } }) => {
    const COMPONENT_MAP = {
      Query,
      Sources,
      VectorCreation,
      Heading,
      GPT,
      FollowUp,
    };

    const Component = COMPONENT_MAP[message.type];
    return Component ? (
      <Component content={message.content} sendMessage={sendMessage} />
    ) : null;
  }
);

// Add this line after the component definition
MessageHandler.displayName = "MessageHandler";

// Onboarding component to guide users to connect their accounts
const OnboardingFlow = ({ onClose, setHasSeenOnboarding }) => {
  const handleClose = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Update the user record in the database
        const { error } = await supabase
          .from("users")
          .update({ hasSeenChatOnboarding: true })
          .eq("id", session.user.id);

        if (error) {
          console.error("Error updating hasSeenChatOnboarding:", error);
        }
      }

      // Also set in localStorage for redundancy
      localStorage.setItem("hasSeenOnboarding", "true");
      setHasSeenOnboarding(true);
      onClose();
    } catch (error) {
      console.error("Error in handleClose:", error);
      // Still close the modal even if there's an error
      setHasSeenOnboarding(true);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
      {/* Main content positioned to avoid navbar */}
      <div
        className="bg-black bg-opacity-90 rounded-lg border border-zinc-700 max-w-4xl w-full p-6 relative pointer-events-auto"
      >
        <div className="absolute -top-2 -left-2 bg-zinc-700 p-2 rounded-full shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">
          Welcome to Amurex!
        </h2>

        <p className="text-zinc-300 mb-6">
          To get the most out of Amurex, connect your accounts to access your
          documents and information.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                alt="Google Docs"
                className="w-8 h-8"
              />
              <h3 className="text-xl font-medium text-white">Google Docs</h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Connect your Google account to search and reference your
              documents.
            </p>
            <a
              href="/settings?tab=personalization"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#9334E9] text-white rounded-lg hover:bg-[#7928CA] transition-colors"
            >
              Connect Google
            </a>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                alt="Notion"
                className="w-8 h-8"
              />
              <h3 className="text-xl font-medium text-white">Notion</h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Connect Notion to access and search your workspaces and pages.
            </p>
            <a
              href="/settings?tab=personalization"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#9334E9] text-white rounded-lg hover:bg-[#7928CA] transition-colors"
            >
              Connect Notion
            </a>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                alt="Obsidian"
                className="w-8 h-8"
              />
              <h3 className="text-xl font-medium text-white">Obsidian</h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Upload your Obsidian vault to search through your notes.
            </p>
            <a
              href="/settings?tab=personalization"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#9334E9] text-white rounded-lg hover:bg-[#7928CA] transition-colors"
            >
              Upload Obsidian
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
