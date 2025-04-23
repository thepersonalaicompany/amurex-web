"use client";
// 1. Import required dependencies
import React, { useEffect, useRef, useState, memo } from "react";
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
import { Navbar } from "@/components/Navbar";
import StarButton from "@/components/star-button";
import { useRouter } from "next/navigation";

const BASE_URL_BACKEND = "https://api.amurex.ai";

// 3. Home component
export default function AIChat() {
  // 4. Initialize states and refs
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [googleDocsEnabled, setGoogleDocsEnabled] = useState(true);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [memorySearchEnabled, setMemorySearchEnabled] = useState(true);
  const [hasGoogleDocs, setHasGoogleDocs] = useState(false);
  const [hasMeetings, setHasMeetings] = useState(false);
  const [notionEnabled, setNotionEnabled] = useState(true);
  const [hasNotion, setHasNotion] = useState(false);
  const [obsidianEnabled, setObsidianEnabled] = useState(true);
  const [hasObsidian, setHasObsidian] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hasGmail, setHasGmail] = useState(false);
  const [gmailEnabled, setGmailEnabled] = useState(true);
  const [googleTokenVersion, setGoogleTokenVersion] = useState(null);
  const [showGoogleDocsModal, setShowGoogleDocsModal] = useState(false);
  const [showGmailModal, setShowGmailModal] = useState(false);
  const [showBroaderAccessModal, setShowBroaderAccessModal] = useState(false);
  const [isGoogleAuthInProgress, setIsGoogleAuthInProgress] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true);
  const [searchTime, setSearchTime] = useState(null);

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

    // Cleanup function
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [session?.user?.id]);

  // Replace the existing useEffect for hasSeenOnboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from("users")
          .select("hasSeenChatOnboarding")
          .eq("id", session.user.id)
          .single();

        if (data) {
          setHasSeenOnboarding(!!data.hasSeenChatOnboarding);
        }
      }
    };

    checkOnboardingStatus();
  }, []);

  // Update the useEffect for checking connections
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
        console.log("google token version", data?.google_token_version);
        
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
        console.log("User has meetings:", hasMeetingsData);
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
        console.log("User has Notion connected:", notionConnected);
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
        console.log("User has Obsidian documents:", hasObsidianData);
      });

    // Helper function to check if onboarding should be shown
    const checkOnboarding = (google, notion) => {
      if (!google && !notion && !hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    };
  }, [session?.user?.id, hasSeenOnboarding]);

  // Add a function to fetch suggested prompts
  const fetchSuggestedPrompts = async (userId) => {
    if (!userId) return;
    
    setIsLoadingPrompts(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "prompts",
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prompts");
      }

      const data = await response.json();
      if (data.prompts && Array.isArray(data.prompts)) {
        setSuggestedPrompts(data.prompts);
      } else {
        // Set default prompts if none returned
        setSuggestedPrompts([
          { type: "prompt", text: "What can you help me with?" },
          { type: "prompt", text: "Summarize my recent documents" },
          { type: "prompt", text: "What meetings do I have scheduled today?" }
        ]);
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
      // Set fallback prompts on error
      setSuggestedPrompts([
        { type: "prompt", text: "How can you assist me?" },
        { type: "prompt", text: "Tell me about Amurex features" },
        { type: "prompt", text: "Search my documents for important information" }
      ]);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  // Update useEffect to fetch prompts when session is available
  useEffect(() => {
    if (session?.user?.id) {
      fetchSuggestedPrompts(session.user.id);
    }
  }, [session?.user?.id]);

  // Update sendMessage to handle chat messages and include history
  const sendMessage = (messageToSend) => {
    if (!session?.user?.id) return;

    const message = messageToSend || inputValue;
    if (!message.trim()) return;
    
    setInputValue("");
    setIsLoading(true);
    setChatStarted(true);
    setSearchTime(null); // Reset search time
    
    // Record start time
    const startTime = Date.now();

    // Add user message to chat history
    const userMessage = {
      id: Date.now().toString(),
      user_id: session.user.id,
      payload: {
        type: "user",
        content: message
      },
      created_at: new Date().toISOString()
    };
    
    setMessageHistory(prev => [...prev, userMessage]);

    // Create a placeholder for the AI response
    const aiMessagePlaceholder = {
      id: (Date.now() + 1).toString(),
      user_id: session.user.id,
      payload: {
        type: "GPT",
        content: "",
        searchTime: null
      },
      created_at: new Date().toISOString()
    };
    
    setMessageHistory(prev => [...prev, aiMessagePlaceholder]);

    // Get the current message history to send to the API
    // We need to exclude the placeholder we just added
    const historyToSend = [...messageHistory, userMessage];

    fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        googleDocsEnabled,
        notionEnabled,
        memorySearchEnabled,
        obsidianEnabled,
        gmailEnabled,
        user_id: session.user.id,
        messageHistory: historyToSend, // Include message history
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
        let sources = [];
        let firstChunkReceived = false;

        function readStream() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                setIsLoading(false);
                return;
              }

              // If this is the first chunk, calculate search time
              if (!firstChunkReceived) {
                const endTime = Date.now();
                const timeInSeconds = ((endTime - startTime) / 1000).toFixed(2);
                setSearchTime(timeInSeconds);
                firstChunkReceived = true;
              }

              buffer += decoder.decode(value, { stream: true });

              try {
                // Split by newlines and filter out empty lines
                const lines = buffer.split("\n").filter((line) => line.trim());

                // Process each complete line
                for (let i = 0; i < lines.length; i++) {
                  try {
                    const data = JSON.parse(lines[i]);

                    // Update message history with new content
                    if (data.success) {
                      if (data.sources && data.sources.length > 0) {
                        sources = data.sources;
                      }

                      setMessageHistory(prev => {
                        const newHistory = [...prev];
                        const lastMessage = newHistory[newHistory.length - 1];
                        
                        if (lastMessage && lastMessage.payload.type === "GPT") {
                          lastMessage.payload.content += data.chunk || "";
                          lastMessage.payload.sources = sources;
                          lastMessage.payload.searchTime = searchTime;
                        }
                        
                        return newHistory;
                      });
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
              setIsLoading(false);
            });
        }

        readStream();
      })
      .catch((err) => {
        console.error("Error:", err);
        setIsLoading(false);
      });
  };

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

  // 12. Render chat component
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black lg:ml-[4rem] flex flex-col">
        <div className="fixed top-4 right-4 z-50 hidden">
          <StarButton />
        </div>
        {showOnboarding && (
          <OnboardingFlow
            onClose={() => setShowOnboarding(false)}
            setHasSeenOnboarding={setHasSeenOnboarding}
          />
        )}
        <div className="p-4 md:p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {!showOnboarding && !hasGoogleDocs && !hasNotion && !hasObsidian && (
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

          <h2 className="text-2xl font-medium text-white mb-4">Chat with Amurex</h2>
          <div className="bg-zinc-900/70 rounded-lg border border-zinc-800 flex-1 flex flex-col max-h-[85vh]">
            <div className="p-4 md:p-6 border-b border-zinc-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-[#9334E9]">
                    <ChatCenteredDots className="h-5 w-5" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-medium text-white">
                    Hi! I&apos;m Amurex - your AI assistant for work and life
                  </h1>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-2">
                    {/* Google Docs button */}
                    {googleTokenVersion === "full" ? (
                      <button
                        onClick={() => setGoogleDocsEnabled(!googleDocsEnabled)}
                        className={`px-2 md:px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-white/10 ${
                          googleDocsEnabled
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
                        onClick={() => {
                          if (googleTokenVersion === "old" || googleTokenVersion === null) {
                            setShowGoogleDocsModal(true);
                          } else if (googleTokenVersion === "gmail_only") {
                            setShowBroaderAccessModal(true);
                          } else {
                            window.location.href = "/settings?tab=personalization";
                          }
                        }}
                        className="px-2 md:px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
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

                    {/* Meetings button */}
                    <button
                      onClick={() => setMemorySearchEnabled(!memorySearchEnabled)}
                      className={`px-2 md:px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-white/10 ${
                        memorySearchEnabled && hasMeetings
                          ? "bg-[#3c1671] text-white border-[#6D28D9]"
                          : "bg-zinc-900 text-white"
                      } transition-all duration-200 hover:border-[#6D28D9] ${
                        !hasMeetings ? "opacity-50 cursor-not-allowed" : ""
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

                    {/* Notion button */}
                    {hasNotion ? (
                      <button
                        onClick={() => setNotionEnabled(!notionEnabled)}
                        className={`px-2 md:px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-white/10 ${
                          notionEnabled
                            ? "bg-[#3c1671] text-white border-[#6D28D9]"
                            : "bg-zinc-900 text-white"
                        } transition-all duration-200 hover:border-[#6D28D9]`}
                      >
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                          alt="Notion"
                          className="w-4 h-4"
                        />
                        <span>Notion</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => window.location.href = "/settings?tab=personalization"}
                        className="px-2 md:px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
                      >
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                          alt="Notion"
                          className="w-4 h-4"
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
                        onClick={() => setObsidianEnabled(!obsidianEnabled)}
                        className={`px-2 md:px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-white/10 ${
                          obsidianEnabled
                            ? "bg-[#3c1671] text-white border-[#6D28D9]"
                            : "bg-zinc-900 text-white"
                        } transition-all duration-200 hover:border-[#6D28D9]`}
                      >
                        <img
                          src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                          alt="Obsidian"
                          className="w-4 h-4"
                        />
                        <span>Obsidian</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => window.location.href = "/settings?tab=personalization"}
                        className="px-2 md:px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
                      >
                        <img
                          src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                          alt="Obsidian"
                          className="w-4 h-4"
                        />
                        <span>Obsidian</span>
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          Upload Obsidian Files
                        </span>
                      </button>
                    )}

                    {/* Gmail button */}
                    {googleTokenVersion === "full" || googleTokenVersion === "gmail_only" ? (
                      <button
                        onClick={() => setGmailEnabled(!gmailEnabled)}
                        className={`px-2 md:px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-white/10 ${
                          gmailEnabled
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
                        onClick={() => {
                          if (googleTokenVersion === "old" || googleTokenVersion === null) {
                            setShowGmailModal(true);
                          } else {
                            window.location.href = "/settings?tab=personalization";
                          }
                        }}
                        className="px-2 md:px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
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

            {/* Chat messages area in a scrollable container with fixed height */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6 space-y-4">
                {messageHistory.length > 0 ? (
                  <div className="space-y-6">
                    {messageHistory.map((message, index) => (
                      <div key={message.id} className={`flex ${message.payload.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] ${message.payload.type === 'user' ? 'bg-[#3c1671] text-white' : 'bg-black text-zinc-300'} rounded-lg p-4 border ${message.payload.type === 'user' ? 'border-[#6D28D9]' : 'border-zinc-800'}`}>
                          {message.payload.type === 'user' ? (
                            <div className="text-white">{message.payload.content}</div>
                          ) : (
                            <div>
                              <GPT content={message.payload.content} />
                              {isLoading && index === messageHistory.length - 1 && (
                                <span className="inline-block animate-pulse">▋</span>
                              )}
                              
                              {/* Show search time if available */}
                              {message.payload.searchTime && (
                                <div className="mt-2 text-xs text-zinc-500">
                                  Search time: {message.payload.searchTime}s
                                </div>
                              )}
                              
                              {/* Show sources if available */}
                              {message.payload.sources && message.payload.sources.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-zinc-800">
                                  <div className="text-[#9334E9] font-medium mb-2 text-sm flex items-center gap-2">
                                    <GitBranch size={16} />
                                    <span>Sources</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {message.payload.sources.slice(0, 3).map((source, idx) => (
                                      <a 
                                        key={idx}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs bg-zinc-900 text-zinc-400 px-2 py-1 rounded border border-zinc-800 hover:border-[#6D28D9] transition-colors flex items-center gap-1"
                                      >
                                        <Link size={12} />
                                        {source.title || "Source " + (idx + 1)}
                                      </a>
                                    ))}
                                    {message.payload.sources.length > 3 && (
                                      <span className="text-xs bg-zinc-900 text-zinc-400 px-2 py-1 rounded border border-zinc-800">
                                        +{message.payload.sources.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  !chatStarted && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                      <div className="text-zinc-400 mb-8">
                        <ChatCenteredDots size={48} className="mx-auto mb-4" />
                        <p className="text-xl">Start a conversation with Amurex</p>
                        <p className="text-sm mt-2">Ask me anything about your documents, emails, or meetings</p>
                      </div>
                      
                      {/* Suggested prompts */}
                      <div className="w-full max-w-2xl space-y-2">
                        <div className="text-zinc-500 text-md">Personalized prompt suggestions</div>
                        <div className="flex flex-col gap-3">
                          {isLoadingPrompts || !suggestedPrompts || suggestedPrompts.length === 0 ? (
                            <>
                              {[1, 2, 3].map((_, index) => (
                                <div
                                  key={index}
                                  className="transition-all duration-500 w-full px-4 py-4 pr-16 rounded-lg bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors text-lg text-left relative group animated pulse"
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
                                    className="transition-all duration-500 w-full px-4 py-4 pr-16 rounded-lg bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors text-lg text-left relative group"
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
                                    className="transition-all duration-500 w-full px-4 py-4 pr-16 rounded-lg bg-zinc-900/70 border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors text-lg text-left relative group"
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
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Fixed chat input at the bottom with same width as the message container */}
            <div className="sticky bottom-0 left-0 right-0 p-4 md:p-6 border-t border-zinc-800 bg-zinc-900/90 backdrop-blur-md">
              <ChatInputArea
                inputValue={inputValue}
                setInputValue={setInputValue}
                sendMessage={sendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add modals for Google Docs and Gmail */}
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

/* Updated Chat Input Area component */
export function ChatInputArea({
  inputValue,
  setInputValue,
  sendMessage,
  isLoading,
  className = "",
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex-1 flex items-center">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 p-3 md:p-4 text-sm md:text-base rounded-l-lg focus:outline-none bg-black border border-zinc-800 text-zinc-300 focus:border-[#6D28D9] transition-colors"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isLoading && sendMessage()}
          disabled={isLoading}
        />
      </div>
      <button
        onClick={() => !isLoading && sendMessage()}
        disabled={isLoading}
        className={`p-3 md:p-4 rounded-r-lg bg-black border-t border-r border-b border-zinc-800 text-zinc-300 hover:bg-[#3c1671] transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <div className="animate-spin h-5 w-5 border-2 border-zinc-300 border-t-transparent rounded-full"></div>
        ) : (
          <ArrowCircleRight size={20} className="md:w-6 md:h-6" />
        )}
      </button>
    </div>
  );
}

// 21. Query component for displaying content
export const Query = ({ content = "", sourcesTime, completionTime }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between">
      <div className="text-xl md:text-3xl font-medium text-white">
        {content}
      </div>
      <div className="text-sm text-zinc-500 mt-1 md:mt-0 flex flex-col md:items-end">
        {sourcesTime && (
          <div className="px-2 py-1 rounded-md bg-[#9334E9] text-white w-fit">
            Searched in {sourcesTime} seconds
          </div>
        )}
      </div>
    </div>
  );
};

// 22. Sources component for displaying list of sources
export const Sources = ({ content = [] }) => {
  // Debug the content structure
  useEffect(() => {
    console.log("Sources content:", content);
  }, [content]);

  // Helper function to create Gmail URL from message or thread ID
  const createGmailUrl = (source) => {
    // Check if we have a message_id or thread_id
    if (source.message_id) {
      return `https://mail.google.com/mail/u/0/#inbox/${source.message_id}`;
    } else if (source.thread_id) {
      return `https://mail.google.com/mail/u/0/#inbox/${source.thread_id}`;
    }
    // Fallback to the provided URL or a default
    return source.url || `/emails/${source.id}`;
  };

  if (!content || content.length === 0) {
    return (
      <div>
        <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
          <GitBranch size={20} className="md:w-6 md:h-6" />
          <span>Sources</span>
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

  return (
    <div>
      <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
        <GitBranch size={20} className="md:w-6 md:h-6" />
        <span>Sources</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {Array.isArray(content) &&
          content.map((source, index) => {
            // For debugging
            console.log(`Source ${index}:`, source);

            if (source.type === "meeting") {
              // Check if platform_id exists and is a string before using includes
              let platform = "teams"; // Default to teams

              try {
                if (
                  source.platform_id &&
                  typeof source.platform_id === "string"
                ) {
                  platform = source.platform_id.includes("-")
                    ? "google"
                    : "teams";
                }
              } catch (error) {
                console.error("Error determining platform:", error);
              }

              return (
                <a
                  key={index}
                  href={source.url}
                  className="block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="bg-black rounded-lg p-4 border border-zinc-800 hover:border-[#6D28D9] transition-colors h-[160px] relative">
                    <Link className="absolute top-4 right-4 w-4 h-4 text-zinc-500" />
                    <div className="text-zinc-300 text-sm font-medium mb-2 flex items-center gap-2">
                      {platform === "google" ? (
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Google_Meet_icon_%282020%29.svg/1024px-Google_Meet_icon_%282020%29.svg.png?20221213135236"
                          alt="Google Meet"
                          className="w-8"
                        />
                      ) : (
                        <img
                          src="https://www.svgrepo.com/show/303180/microsoft-teams-logo.svg"
                          alt="Microsoft Teams"
                          className="w-8"
                        />
                      )}
                      {source.title}
                    </div>
                    <div className="text-zinc-500 text-xs overflow-hidden line-clamp-4">
                      <ReactMarkdown>{source.text}</ReactMarkdown>
                    </div>
                  </div>
                </a>
              );
            } else if (source.type === "email") {
              // Create Gmail URL from message_id or thread_id
              const gmailUrl = createGmailUrl(source);

              return (
                <a
                  key={index}
                  href={gmailUrl}
                  className="block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="bg-black rounded-lg p-4 border border-zinc-800 hover:border-[#6D28D9] transition-colors h-[160px] relative">
                    <Link className="absolute top-4 right-4 w-4 h-4 text-zinc-500" />
                    <div className="text-zinc-300 text-sm font-medium mb-2 flex items-center gap-2">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                        alt="Gmail"
                        className="w-6 flex-shrink-0"
                      />
                      <div className="flex flex-col overflow-hidden">
                        <span className="truncate font-medium max-w-full">
                          {source.title}
                        </span>
                        <span className="text-xs text-zinc-400 truncate max-w-full">
                          {source.sender}
                        </span>
                        {source.received_at && (
                          <span className="text-xs text-zinc-500">
                            {new Date(source.received_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-zinc-500 text-xs overflow-hidden line-clamp-4">
                      {source.text}
                    </div>
                  </div>
                </a>
              );
            } else {
              // Handle document types with appropriate icons
              let icon = null;

              if (source.type === "google_docs") {
                icon = (
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                    alt="Google Docs"
                    className="w-6 h-6"
                  />
                );
              } else if (source.type === "notion") {
                icon = (
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                    alt="Notion"
                    className="w-6 h-6"
                  />
                );
              } else if (source.type === "obsidian") {
                icon = (
                  <img
                    src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                    alt="Obsidian"
                    className="w-6 h-6"
                  />
                );
              }

              return (
                <a
                  key={index}
                  href={source.url}
                  className="block"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="bg-black rounded-lg p-4 border border-zinc-800 hover:border-[#6D28D9] transition-colors h-[160px] relative">
                    <Link className="absolute top-4 right-4 w-4 h-4 text-zinc-500" />
                    <div className="text-zinc-300 text-sm font-medium mb-2 flex items-center gap-2">
                      {icon}
                      <span className="truncate">
                        {source.title || "Document"}
                      </span>
                    </div>
                    <div className="text-zinc-500 text-xs overflow-hidden line-clamp-4">
                      <ReactMarkdown>{source.text}</ReactMarkdown>
                    </div>
                  </div>
                </a>
              );
            }
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

    console.log("userData", userData);

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
        className="prose text-base mt-1 w-full break-words prose-p:leading-relaxed"
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} style={{ color: "blue", fontWeight: "bold" }} />
          ),
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
export const FollowUp = ({ content = "", sendMessage = () => {} }) => {
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
  ({ message = { type: "", content: "" }, sendMessage = () => {} }) => {
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
      {/* Overlay with click-through for navbar */}
      <div
        className="absolute inset-0 bg-zinc-800 bg-opacity-40 pointer-events-auto"
        style={{ marginLeft: "64px" }}
      ></div>

      {/* Main content positioned to avoid navbar */}
      <div
        className="bg-black bg-opacity-90 rounded-lg border border-zinc-700 max-w-4xl w-full p-6 relative pointer-events-auto"
        style={{ marginLeft: "64px" }}
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
