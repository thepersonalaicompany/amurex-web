"use client";
// 1. Import required dependencies
import React, { useEffect, useRef, useState, memo } from "react";
import {
  ArrowCircleRight,
  ChatCenteredDots,
  Stack,
  GitBranch,
  Link,
  EnvelopeSimple,
} from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/lib/supabaseClient";
import { Navbar } from "@/components/Navbar";
import StarButton from "@/components/star-button";
import { useRouter } from "next/navigation";

const BASE_URL_BACKEND = "https://api.amurex.ai";

// 3. Home component
export default function AISearch() {
  // 4. Initialize states and refs
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [googleDocsEnabled, setGoogleDocsEnabled] = useState(true);
  const [session, setSession] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [memorySearchEnabled, setMemorySearchEnabled] = useState(true);
  const [hasGoogleDocs, setHasGoogleDocs] = useState(false);
  const [hasMeetings, setHasMeetings] = useState(false);
  const [notionEnabled, setNotionEnabled] = useState(true);
  const [hasNotion, setHasNotion] = useState(false);
  const [obsidianEnabled, setObsidianEnabled] = useState(true);
  const [hasObsidian, setHasObsidian] = useState(false);
  const [isSearchInitiated, setIsSearchInitiated] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

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

    supabase
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
      .subscribe();

    supabase
      .from("message_history")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true })
      .then(({ data: message_history, error }) =>
        error ? console.log("error", error) : setMessageHistory(message_history)
      );
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

  // Add useEffect to check connections
  useEffect(() => {
    if (!session?.user?.id) return;

    let googleConnected = false;
    let notionConnected = false;
    let connectionsChecked = 0;

    // Check Google Docs connection
    supabase
      .from("users")
      .select("google_docs_connected")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        googleConnected = !!data?.google_docs_connected;
        setHasGoogleDocs(googleConnected);
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
      .then(({ data }) => setHasMeetings(!!data?.length));

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
      .then(({ data }) => setHasObsidian(!!data?.length));

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
        const response = await fetch("/api/chat", {
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
        console.log("prompts:", prompts);
        setSuggestedPrompts(prompts.prompts); // Access the nested prompts array
      });
  }, [session?.user?.id]);

  // Update sendMessage to check enabled sources
  const sendMessage = (messageToSend) => {
    if (!session?.user?.id) return;

    const message = messageToSend || inputValue;
    setInputValue("");
    setIsSearching(true);
    setIsSearchInitiated(true);

    setSearchResults({
      query: message,
      sources: [],
      vectorResults: [],
      answer: "",
    });

    fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        googleDocsEnabled,
        notionEnabled,
        memorySearchEnabled,
        obsidianEnabled,
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

        function processText(text) {
          const lines = text.split("\n");
          return lines
            .filter((line) => line.trim())
            .map((line) => JSON.parse(line));
        }

        function readStream() {
          reader
            .read()
            .then(({ done, value }) => {
              if (done) {
                setIsSearching(false);
                return;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = processText(buffer);

              lines.forEach((data) => {
                if (data.success) {
                  setSearchResults((prev) => {
                    // Only add the new content from this chunk
                    const newContent = data.chunk || "";
                    return {
                      ...prev,
                      sources: data.sources || prev.sources,
                      answer: prev.answer + newContent,
                      done: data.done || false,
                    };
                  });
                  console.log("sources:", data.sources);
                } else {
                  console.error("Error:", data.error);
                }
              });

              buffer = ""; // Clear the buffer after processing
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
  // 12. Render home component
  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen bg-black lg:ml-[4rem] ${
          isSearchInitiated ? "pt-6" : "flex items-center justify-center"
        }`}
      >
        <div className="fixed top-4 right-4 z-50">
          <StarButton />
        </div>
        {showOnboarding && (
          <OnboardingFlow
            onClose={() => setShowOnboarding(false)}
            setHasSeenOnboarding={setHasSeenOnboarding}
          />
        )}
        <div className="p-3 md:p-6 max-w-7xl mx-auto w-full">
          {!showOnboarding && !hasGoogleDocs && !hasNotion && (
            <div className="bg-[#1E1E24] rounded-lg border border-zinc-800 p-4 mb-4 flex flex-col md:flex-row items-center justify-between">
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
                  Connect your Google Docs or Notion to get the most out of
                  Amurex
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
          <div className="bg-[#09090A] rounded-lg border border-zinc-800 relative">
            <div className="p-4 md:p-6 border-b border-zinc-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-[#9334E9]">
                    <ChatCenteredDots className="h-5 w-5" />
                  </div>
                  <h1 className="text-xl md:text-2xl font-medium text-white">
                    Hi! I&apos;m Amurex - your AI assistant for work and life.
                  </h1>
                </div>
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <div className="grid grid-cols-2 md:flex items-center gap-2">
                    {!hasGoogleDocs ? (
                      <a
                        href="/settings?tab=personalization"
                        target="_blank"
                        className="px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 cursor-pointer text-[#FAFAFA] opacity-80 hover:bg-[#3c1671] transition-all duration-200 whitespace-nowrap relative group"
                      >
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                          alt="Google Docs"
                          className="w-3 h-3 md:w-4 md:h-4"
                        />
                        Google Docs
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          Connect Google Docs
                        </span>
                      </a>
                    ) : (
                      <button
                        onClick={() => setGoogleDocsEnabled(!googleDocsEnabled)}
                        className={`px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 ${
                          googleDocsEnabled
                            ? "bg-[#9334E9] text-[#FAFAFA]"
                            : "text-[#FAFAFA]"
                        } transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]`}
                      >
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                          alt="Google Docs"
                          className="w-3 h-3 md:w-4 md:h-4"
                        />
                        Google Docs
                        {googleDocsEnabled && (
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4 ml-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    )}

                    {!hasMeetings ? (
                      <a
                        href="https://chromewebstore.google.com/detail/Amurex%20%28Early%20Preview%29/dckidmhhpnfhachdpobgfbjnhfnmddmc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-md font-medium border border-white/10 cursor-pointer text-[#FAFAFA] opacity-80 hover:bg-[#3c1671] transition-all duration-200 whitespace-nowrap relative group"
                      >
                        <ChatCenteredDots className="w-4 h-4" />
                        Meetings
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          Connect Meetings
                        </span>
                      </a>
                    ) : (
                      <button
                        onClick={() =>
                          setMemorySearchEnabled(!memorySearchEnabled)
                        }
                        className={`px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 ${
                          memorySearchEnabled
                            ? "bg-[#9334E9] text-[#FAFAFA]"
                            : "text-[#FAFAFA]"
                        } transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]`}
                      >
                        <ChatCenteredDots className="w-3 h-3 md:w-4 md:h-4" />
                        Meetings
                        {memorySearchEnabled && (
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4 ml-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:flex items-center gap-2">
                    {!hasNotion ? (
                      <a
                        href="/settings?tab=personalization"
                        target="_blank"
                        className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-md font-medium border border-white/10 cursor-pointer text-[#FAFAFA] opacity-80 hover:bg-[#3c1671] transition-all duration-200 whitespace-nowrap relative group"
                      >
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                          alt="Notion"
                          className="w-4 h-4"
                        />
                        Notion
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          Connect Notion
                        </span>
                      </a>
                    ) : (
                      <button
                        onClick={() => setNotionEnabled(!notionEnabled)}
                        className={`px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 ${
                          notionEnabled
                            ? "bg-[#9334E9] text-[#FAFAFA]"
                            : "text-[#FAFAFA]"
                        } transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]`}
                      >
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                          alt="Notion"
                          className="w-3 h-3 md:w-4 md:h-4"
                        />
                        Notion
                        {notionEnabled && (
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4 ml-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    )}

                    {!hasObsidian ? (
                      <a
                        href="/settings?tab=personalization"
                        target="_blank"
                        className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-md font-medium border border-white/10 cursor-pointer text-[#FAFAFA] opacity-80 hover:bg-[#3c1671] transition-all duration-200 whitespace-nowrap relative group"
                      >
                        <img
                          src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                          alt="Obsidian"
                          className="w-4 h-4"
                        />
                        Obsidian
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                          Upload Obsidian Files
                        </span>
                      </a>
                    ) : (
                      <button
                        onClick={() => setObsidianEnabled(!obsidianEnabled)}
                        className={`px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 ${
                          obsidianEnabled
                            ? "bg-[#9334E9] text-[#FAFAFA]"
                            : "text-[#FAFAFA]"
                        } transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]`}
                      >
                        <img
                          src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                          alt="Obsidian"
                          className="w-3 h-3 md:w-4 md:h-4"
                        />
                        Obsidian
                        {obsidianEnabled && (
                          <svg
                            className="w-3 h-3 md:w-4 md:h-4 ml-1"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M20 6L9 17L4 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
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
                  className="w-full"
                />

                {!isSearchInitiated && (
                  <div className="mt-4 space-y-2">
                    <div className="text-zinc-500 text-sm">
                      Suggested searches:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {suggestedPrompts.length === 0 ? (
                        <>
                          {[1, 2, 3].map((_, index) => (
                            <div
                              key={index}
                              className="h-[52px] bg-black rounded-lg border border-zinc-800 animate-pulse"
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
                                className="px-4 py-2 rounded-lg bg-black border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] transition-colors text-sm text-left"
                              >
                                {item.text}
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
                                className="px-4 py-2 rounded-lg bg-black border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] transition-colors text-sm text-left flex items-center justify-between"
                              >
                                <span>{item.text}</span>
                              </button>
                            ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {(isSearching || searchResults?.query) && (
                <div className="space-y-6">
                  <Query content={searchResults?.query || ""} />

                  <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
                    <div>
                      <Heading content="Answer" />
                      <div className="bg-black rounded-lg p-4 border border-zinc-800 text-zinc-300">
                        <GPT content={searchResults?.answer || ""} />
                        {isSearching && (
                          <span className="inline-block animate-pulse">▋</span>
                        )}
                      </div>
                    </div>

                    {searchResults?.sources?.length > 0 && (
                      <div>
                        <Sources content={searchResults.sources} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
      <input
        type="text"
        placeholder="Type your search..."
        className="flex-1 p-3 md:p-4 text-sm md:text-base rounded-l-lg focus:outline-none bg-black border border-zinc-800 text-zinc-300"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
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
export const Query = ({ content = "" }) => {
  return (
    <div className="text-xl md:text-3xl font-medium text-white">{content}</div>
  );
};
/* 22. Sources component for displaying list of sources */
export const Sources = ({ content = [] }) => {
  const [meetings, setMeetings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeetingTypes = async () => {
      if (!content.length) {
        setIsLoading(false);
        return;
      }

      // Filter only meeting sources
      const meetingSources = content.filter((source) => source.meeting_id);
      const meetingIds = meetingSources.map((source) => source.meeting_id);

      if (meetingIds.length > 0) {
        const { data, error } = await supabase
          .from("late_meeting")
          .select("id, meeting_id")
          .in("id", meetingIds);

        if (error) {
          console.error("Error fetching meeting types:", error);
          setIsLoading(false);
          return;
        }

        // Create a map of meeting IDs and their types
        const meetingMap = {};
        data.forEach((meeting) => {
          meetingMap[meeting.id] = {
            ...meeting,
            platform: meeting.meeting_id.includes("-") ? "google" : "teams",
          };
        });
        setMeetings(meetingMap);
      }

      setIsLoading(false);
    };

    fetchMeetingTypes();
  }, [content]);

  if (isLoading) {
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
          content.map((source, index) =>
            source.meeting_id ? (
              // Meeting source
              <a
                key={index}
                href={`/meetings/${source.meeting_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="bg-black rounded-lg p-4 border border-zinc-800 hover:border-[#6D28D9] transition-colors h-[160px] relative">
                  <Link className="absolute top-4 right-4 w-4 h-4 text-zinc-500" />
                  <div className="text-zinc-300 text-sm font-medium mb-2 flex items-center gap-2">
                    {meetings[source.meeting_id]?.platform === "google" ? (
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
                    {meetings[source.meeting_id]?.platform === "google"
                      ? "Google Meet"
                      : "Microsoft Teams"}
                    , Meeting ID: {meetings[source.meeting_id]?.meeting_id}
                  </div>
                  <div className="text-zinc-500 text-xs overflow-hidden line-clamp-4">
                    <ReactMarkdown>{source.text}</ReactMarkdown>
                  </div>
                </div>
              </a>
            ) : (
              // Document source
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
                    {source.type === "google_docs" ? (
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                        alt="Google Docs"
                        className="w-6"
                      />
                    ) : source.type === "notion" ? (
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                        alt="Notion"
                        className="w-6"
                      />
                    ) : source.type === "obsidian" ? (
                      <img
                        src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                        alt="Obsidian"
                        className="w-6"
                      />
                    ) : (
                      <Stack size={24} />
                    )}
                    <span className="truncate">Title: {source.title}</span>
                  </div>
                  <div className="text-zinc-500 text-xs overflow-hidden line-clamp-4">
                    <ReactMarkdown>{source.text}</ReactMarkdown>
                  </div>
                </div>
              </a>
            )
          )}
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
        className="prose text-base md:text-xl mt-1 w-full break-words prose-p:leading-relaxed"
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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="absolute top-4 right-20 z-50">
        <button
          onClick={handleClose}
          className="px-5 py-2.5 bg-[#1E1E24] text-zinc-300 hover:text-white hover:bg-[#2A2A36] rounded-lg border border-zinc-700 transition-colors font-medium shadow-lg"
        >
          Skip for now
        </button>
      </div>

      <div className="bg-[#09090A] rounded-lg border border-zinc-800 max-w-4xl w-full p-6 relative">
        <h2 className="text-2xl font-bold text-white mb-6">
          Welcome to Amurex!
        </h2>

        <p className="text-zinc-300 mb-6">
          To get the most out of Amurex, connect your accounts to access your
          documents and information.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black rounded-lg p-6 border border-zinc-800">
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

          <div className="bg-black rounded-lg p-6 border border-zinc-800">
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

          <div className="bg-black rounded-lg p-6 border border-zinc-800">
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
