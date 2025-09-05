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
import "./search.css";
import Popup from "@/components/Popup/Popup";

// Add SpotlightSearch component after imports
const SpotlightSearch = ({
  isVisible,
  onClose,
  onSearch,
  suggestedPrompts = [],
  sourceFilters = {},
  customPlaceholder,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef(null);

  // Add state for Gmail dropdown in SpotlightSearch
  const [isGmailDropdownVisible, setIsGmailDropdownVisible] = useState(false);
  const [dropdownTimeout, setDropdownTimeout] = useState(null);

  // Reset selected suggestion when input changes
  useEffect(() => {
    setSelectedSuggestion(-1);
  }, [inputValue]);

  // Reset state when popup visibility changes
  useEffect(() => {
    if (isVisible) {
      setInputValue("");
      setSelectedSuggestion(-1);
    }
  }, [isVisible]);

  useEffect(() => {
    // Focus input when popup becomes visible
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Handle keyboard navigation and escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e) => {
      const filteredPrompts = suggestedPrompts
        .filter((item) => item.type === "prompt")
        .slice(0, 3);

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestion((prev) =>
          prev < filteredPrompts.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestion((prev) => (prev > -1 ? prev - 1 : -1));
      } else if (e.key === "Enter") {
        if (
          selectedSuggestion >= 0 &&
          selectedSuggestion < filteredPrompts.length
        ) {
          e.preventDefault();
          onSearch(filteredPrompts[selectedSuggestion].text);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose, selectedSuggestion, suggestedPrompts, onSearch]);

  // Close when clicking outside
  const handleOutsideClick = (e) => {
    if (e.target.classList.contains("spotlight-overlay")) {
      onClose();
    }
  };

  // Handle search submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue);
    }
  };

  if (!isVisible) return null;

  const filteredPrompts = suggestedPrompts
    .filter((item) => item.type === "prompt")
    .slice(0, 3);

  const {
    showGoogleDocs,
    setShowGoogleDocs,
    showNotion,
    setShowNotion,
    showMeetings,
    setShowMeetings,
    showObsidian,
    setShowObsidian,
    showGmail,
    setShowGmail,
    hasGoogleDocs,
    hasNotion,
    hasObsidian,
    hasMeetings,
    hasGmail,
    handleGoogleDocsClick,
    handleNotionClick,
    handleMeetingsClick,
    handleObsidianClick,
    handleGmailClick,
    gmailProfiles, // Now getting gmailProfiles from sourceFilters
  } = sourceFilters;

  return (
    <div
      className="spotlight-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleOutsideClick}
    >
      <div className="spotlight-container w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl">
        <form onSubmit={handleSubmit} className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
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
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={customPlaceholder || "Search your knowledge..."}
            className="w-full bg-transparent px-12 py-4 text-lg text-white focus:outline-none"
          />
          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-zinc-400">
            <span className="text-xs">ESC to close</span>
          </div>
        </form>

        {/* Source selection buttons */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-2 text-xs text-zinc-500">Search across</div>
          <div className="flex flex-wrap gap-2">
            {/* Gmail button - implemented with dropdown similar to AISearch component */}
            {hasGmail ? (
              <div
                className="relative"
                onMouseEnter={() => {
                  // Clear any existing timeout when mouse enters
                  if (dropdownTimeout) {
                    clearTimeout(dropdownTimeout);
                    setDropdownTimeout(null);
                  }
                  setIsGmailDropdownVisible(true);
                }}
                onMouseLeave={() => {
                  // Set a timeout to hide the dropdown after 300ms
                  const timeout = setTimeout(() => {
                    setIsGmailDropdownVisible(false);
                  }, 300);
                  setDropdownTimeout(timeout);
                }}
              >
                <button
                  onClick={() => setShowGmail(!showGmail)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                    showGmail
                      ? "border-[#6D28D9] bg-[#3c1671] text-white"
                      : "bg-zinc-900 text-white"
                  } transition-all duration-200 hover:border-[#6D28D9]`}
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                    alt="Gmail"
                    className="w-3.5"
                  />
                  <span>Gmail</span>
                </button>
                {isGmailDropdownVisible && (
                  <div
                    className="absolute left-0 top-full mt-1 min-w-[200px] rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-400 shadow-lg"
                    onMouseEnter={() => {
                      // Clear timeout when mouse enters dropdown
                      if (dropdownTimeout) {
                        clearTimeout(dropdownTimeout);
                        setDropdownTimeout(null);
                      }
                    }}
                    onMouseLeave={() => {
                      // Set timeout to hide dropdown when mouse leaves
                      const timeout = setTimeout(() => {
                        setIsGmailDropdownVisible(false);
                      }, 300);
                      setDropdownTimeout(timeout);
                    }}
                  >
                    {gmailProfiles && gmailProfiles.length > 0 ? (
                      <>
                        {gmailProfiles.map((profile) => (
                          <div
                            key={profile.email}
                            className="border-b border-zinc-800 px-3 py-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{profile.email}</span>
                              <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px]">
                                {profile.type === "full" ? "Full" : "Gmail"}
                              </span>
                            </div>
                          </div>
                        ))}
                        <div className="p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              initiateGmailAuth(); // Use the new direct auth function
                            }}
                            className="flex w-full items-center justify-center gap-1.5 rounded bg-zinc-800 px-2 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-700"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add account
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 text-center">
                        <p className="mb-2 text-zinc-500">
                          No Gmail accounts connected
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateGmailAuth(); // Use the new direct auth function
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded bg-zinc-800 px-2 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                          Add account
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleGmailClick}
                className="relative flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[#3c1671]"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                  alt="Gmail"
                  className="w-3.5"
                />
                <span>Gmail</span>
              </button>
            )}
            {/* Google Docs button */}
            {hasGoogleDocs ? (
              <button
                onClick={() => setShowGoogleDocs(!showGoogleDocs)}
                className={`flex hidden items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                  showGoogleDocs
                    ? "border-[#6D28D9] bg-[#3c1671] text-white"
                    : "bg-zinc-900 text-white"
                } transition-all duration-200 hover:border-[#6D28D9]`}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                  alt="Google Docs"
                  className="h-3.5 w-3.5"
                />
                <span>Docs</span>
              </button>
            ) : (
              <button
                onClick={handleGoogleDocsClick}
                className="group relative flex hidden items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[#3c1671]"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                  alt="Google Docs"
                  className="h-3.5 w-3.5"
                />
                <span>Docs</span>
              </button>
            )}

            {/* Notion button */}
            {hasNotion ? (
              <button
                onClick={() => setShowNotion(!showNotion)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                  showNotion
                    ? "border-[#6D28D9] bg-[#3c1671] text-white"
                    : "bg-zinc-900 text-white"
                } transition-all duration-200 hover:border-[#6D28D9]`}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                  alt="Notion"
                  className="w-3.5"
                />
                <span>Notion</span>
              </button>
            ) : (
              <button
                onClick={handleNotionClick}
                className="group relative flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[#3c1671]"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                  alt="Notion"
                  className="w-3.5"
                />
                <span>Notion</span>
              </button>
            )}

            {/* Obsidian button */}
            {hasObsidian ? (
              <button
                onClick={() => setShowObsidian(!showObsidian)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                  showObsidian
                    ? "border-[#6D28D9] bg-[#3c1671] text-white"
                    : "bg-zinc-900 text-white"
                } transition-all duration-200 hover:border-[#6D28D9]`}
              >
                <img
                  src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                  alt="Obsidian"
                  className="w-3.5"
                />
                <span>Obsidian</span>
              </button>
            ) : (
              <button
                onClick={handleObsidianClick}
                className="group relative flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[#3c1671]"
              >
                <img
                  src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                  alt="Obsidian"
                  className="w-3.5"
                />
                <span>Obsidian</span>
              </button>
            )}

            {/* Meetings button */}
            <button
              onClick={() => setShowMeetings(!showMeetings)}
              className={`flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                showMeetings && hasMeetings
                  ? "border-[#6D28D9] bg-[#3c1671] text-white"
                  : "bg-zinc-900 text-white"
              } transition-all duration-200 hover:border-[#6D28D9] ${
                !hasMeetings ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={!hasMeetings}
            >
              <ChatCenteredDots className="h-3.5 w-3.5" />
              <span>Meetings</span>
            </button>
          </div>
        </div>

        {/* Suggested prompts */}
        {filteredPrompts.length > 0 && (
          <div className="border-t border-white/10 p-3">
            <div className="mb-2 px-2 text-xs text-zinc-500">
              Suggested searches
            </div>
            <div className="space-y-1">
              {filteredPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(prompt.text);
                    // Don't immediately call onSearch here
                  }}
                  className={`flex w-full items-center rounded px-3 py-2 text-left text-sm text-zinc-300 transition-colors ${selectedSuggestion === idx ? "bg-white/10" : "hover:bg-white/5"}`}
                  onMouseEnter={() => setSelectedSuggestion(idx)}
                  onMouseLeave={() => setSelectedSuggestion(-1)}
                >
                  <svg
                    className="mr-2 h-4 w-4 min-w-4 flex-shrink-0 text-zinc-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {prompt.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
SpotlightSearch.displayName = "SpotlightSearch";

const BASE_URL_BACKEND = "https://api.amurex.ai";

// 3. Home component
export default function AISearch() {
  // Initialize ldrs in a useEffect instead
  useEffect(() => {
    // Dynamically import ldrs only on the client side
    import("ldrs").then(({ ring }) => {
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
  const [isSidebarOpened, setIsSidebarOpened] = useState(false);
  const [sidebarSessions, setSidebarSessions] = useState([]);
  const [groupedSidebarSessions, setGroupedSidebarSessions] = useState({});
  const [collapsedDays, setCollapsedDays] = useState({});
  const [isWaitingSessions, setIsWaitingSessions] = useState(true);
  const [currentThread, setCurrentThread] = useState([]); // Initialize as empty array
  const [currentThreadId, setCurrentThreadId] = useState("");
  const [
    isDeletionConfirmationPopupOpened,
    setIsDeletionConfirmationPopupOpened,
  ] = useState(false);
  const [deletionConfirmation, setDeletionConfirmation] = useState({
    deletingThread: {
      title: "None",
    },
    isWaiting: false,
    error: "",
  });
  const [showSpotlight, setShowSpotlight] = useState(false);

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

  // Add state for user name and random prompt
  const [userName, setUserName] = useState("");
  const [randomPrompt, setRandomPrompt] = useState("");

  // Add array of predefined prompts
  const personalizedPrompts = [
    "What do you want to know, {name}?",
    "Ask me anything, {name}.",
    "Hey, {name}, what are you curious about?",
    "Need help finding something, {name}?",
    "Let's explore a topic, {name}.",
    "Got a question in mind, {name}?",
    "Looking for answers, {name}?",
    "What should we search for, {name}?",
    "Start with a question, {name}.",
    "Ready to learn something new, {name}?",
  ];

  // Add router
  const router = useRouter();

  // Add useEffect to fetch user's name and select random prompt
  useEffect(() => {
    if (!session?.user?.id) return;

    // Get user's name using RPC instead of directly querying the users table
    supabase
      .rpc("get_auth_user_by_public_id", { p_user_id: session.user.id })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching user data:", error);
          return;
        }

        const first_name = data[0]?.first_name;
        setUserName(first_name);

        // Select a random prompt and personalize it with the user's name
        const randomIndex = Math.floor(
          Math.random() * personalizedPrompts.length
        );
        let prompt = personalizedPrompts[randomIndex];

        // Replace {name} placeholder with actual name if the prompt has it
        if (prompt.includes("{name}") && first_name) {
          prompt = prompt.replace("{name}", first_name);
        }

        setRandomPrompt(prompt);
      });
  }, [session?.user?.id]);

  // Add global hotkey for Spotlight search - PLACED AFTER ALL STATE DECLARATIONS
  useEffect(() => {
    const handleHotkey = (e) => {
      // Check for Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Just show spotlight without resetting thread
        setShowSpotlight(true);
      }
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, []);

  // Update SpotlightSearch component integration to handle new searches
  const handleSpotlightSearch = (query) => {
    setShowSpotlight(false);
    setInputValue(query);
    setIsSearchInitiated(true);
    // Call sendMessage with isNewSearch=true
    sendMessage(query, true);
  };

  // Update handleNewSearch to reset and show spotlight
  const handleNewSearch = () => {
    setShowSpotlight(true); // Show the spotlight search
  };

  // Add auto-focus on input when typing - PLACED AFTER ALL STATE DECLARATIONS
  useEffect(() => {
    // Only add this listener when a thread is active and not when spotlight is open
    if (isSearchInitiated && !showSpotlight) {
      const handleKeyPress = (e) => {
        // Ignore if user is typing in an input or pressing modifier keys
        if (
          e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.metaKey ||
          e.ctrlKey ||
          e.altKey
        ) {
          return;
        }

        // Focus the input field when user starts typing
        const input = document.querySelector(".followUpInputArea input");
        if (input) {
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
        error ? console.log("error", error) : setMessageHistory(message_history)
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
        const groupedThreads = {};
        const initialCollapsedState = {};

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
          googleConnected && data?.google_token_version === "full"
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
    const checkOnboarding = (google, notion) => {
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

  // Update sendMessage to immediately update sidebar when new thread is created
  const sendMessage = async (messageToSend, isNewSearch = false) => {
    if (!session?.user?.id) return;

    const message = messageToSend || inputValue;

    // Reset current thread if this is a new search from spotlight or explicitly marked as new search
    if (showSpotlight || isNewSearch) {
      setCurrentThread([]);
      setCurrentThreadId("");
    }

    setCurrentThread((prev) => [
      ...prev,
      {
        query: message,
        sources: [],
        vectorResults: [],
        answer: "",
      },
    ]);

    if (!message.trim()) return;

    let threadId = "";

    try {
      // Create a new thread if we don't have a current thread ID or this is explicitly a new search
      if (!currentThreadId || isNewSearch) {
        console.log("creating new thread");
        // creating a new thread
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
        setCurrentThreadId(threadData.id);

        // IMMEDIATELY update the sidebar with the new thread
        // Update sidebarSessions state
        setSidebarSessions((prev) => [
          {
            id: threadData.id,
            title: message.slice(0, 50),
            created_at: new Date().toISOString(),
            user_id: session.user.id,
          },
          ...prev,
        ]);

        // Add the new thread to groupedSidebarSessions
        const today = new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        });

        setGroupedSidebarSessions((prev) => {
          const newGrouped = { ...prev };
          if (!newGrouped[today]) {
            newGrouped[today] = [];
          }
          newGrouped[today] = [
            {
              id: threadData.id,
              title: message.slice(0, 50),
              created_at: new Date().toISOString(),
              user_id: session.user.id,
            },
            ...newGrouped[today],
          ];
          return newGrouped;
        });
      } else {
        threadId = currentThreadId;
      }

      console.log("✅ Message sent & thread created!");
    } catch (err) {
      console.error("Unexpected error:", err);
    }

    // ... rest of the function remains the same

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

    const transformedMessages = currentThread.flatMap((item) => {
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

        // Update thread in real-time during streaming
        const updateThreadWithStreamingContent = (chunk) => {
          setCurrentThread((prev) => {
            const updatedThread = [...prev];
            // Only update the last item in the thread array
            if (updatedThread.length > 0) {
              const lastIndex = updatedThread.length - 1;
              updatedThread[lastIndex] = {
                ...updatedThread[lastIndex],
                reply: (updatedThread[lastIndex].reply || "") + chunk,
              };
            }
            return updatedThread;
          });
        };

        function readStream() {
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
                console.log("done");

                // writing results as the last element of currentThread
                // This is now just a safety measure as the thread is updated in real-time
                setCurrentThread((prev) => {
                  console.log(
                    "Finalizing thread update, thread length:",
                    prev.length
                  );
                  // Just in case the array is empty (shouldn't happen)
                  if (prev.length === 0) return prev;

                  return prev.map((item, index) => {
                    if (index === prev.length - 1) {
                      console.log("Updating last message with final content");
                      return {
                        ...item,
                        sources: finalSources,
                        reply: finalAnswer,
                        completionTime: completionTimeLocal,
                      };
                    }
                    return item;
                  });
                });

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
                  console.error("Failed to upload assistant response:", e);
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
                          setCompletionTime(
                            ((currentTime - startTime) / 1000).toFixed(1)
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

                      setSearchResults((prev) => ({
                        ...prev,
                        sources: data.sources || prev.sources,
                        answer: prev.answer + (data.chunk || ""),
                        done: data.done || false,
                      }));
                      console.log(data.sources || prev.sources);
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
    console.log("opening thread" + threadId);
    setShowSpotlight(false); // Close spotlight if open
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
        })
      );
      console.log(transformedData);

      setCurrentThreadId(threadId);
      setCurrentThread(transformedData);
      setIsSearchInitiated(true);
    } catch (err) {
      setIsWaitingSessions(false);
      console.error("Unexpected error:", err);
    }
  };

  const deleteThread = async () => {
    console.log(`Deleting: ${deletionConfirmation?.deletingThread}`);
    console.log(deletionConfirmation?.deletingThread);
    try {
      if (deletionConfirmation?.deletingThread) {
        const threadId = deletionConfirmation?.deletingThread?.id;
        setDeletionConfirmation((prev) => ({
          ...prev,
          isWaiting: true,
          error: "",
        }));

        // Delete thread from DB
        const { error } = await supabase
          .from("threads")
          .delete()
          .eq("id", threadId);

        if (error) {
          console.error("Error deleting thread:", error.message);
          setDeletionConfirmation((prev) => ({
            ...prev,
            isWaiting: false,
            error: "Failed to delete thread from server",
          }));
          return;
        }

        // Remove from client-side list
        setSidebarSessions((prev) =>
          prev.filter((session) => session.id !== threadId)
        );

        // Also update the grouped sessions
        setGroupedSidebarSessions((prev) => {
          const newGrouped = { ...prev };
          // Loop through each day group
          Object.keys(newGrouped).forEach((date) => {
            // Filter out the deleted thread from this day's threads
            newGrouped[date] = newGrouped[date].filter(
              (session) => session.id !== threadId
            );
            // If this day now has no threads, remove the day entirely
            if (newGrouped[date].length === 0) {
              delete newGrouped[date];
            }
          });
          return newGrouped;
        });

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
      setDeletionConfirmation((prev) => ({
        ...prev,
        isWaiting: false,
        error: "Something went wrong, please try again later",
      }));
    }
  };

  // Add function to initiate Google auth
  const initiateGoogleAuth = async () => {
    try {
      setIsGoogleAuthInProgress(true);

      // Call the Google auth API directly
      const response = await fetch("/api/google/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
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
  };

  // Add a new function for Gmail-only auth directly from search page
  const initiateGmailAuth = async () => {
    try {
      // Create a loading indicator or state if needed

      // Call the Google auth API directly with gmail_only type
      const response = await fetch("/api/google/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
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

  // Add new state for Gmail profiles
  const [gmailProfiles, setGmailProfiles] = useState([]);
  const [isGmailDropdownVisible, setIsGmailDropdownVisible] = useState(false);

  // Update useEffect to fetch Gmail profiles
  useEffect(() => {
    const fetchGmailProfiles = async () => {
      if (hasGmail && session?.user?.id) {
        try {
          const response = await fetch(
            `/api/google/profile?userId=${session.user.id}`
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

  // Add new state for dropdown timeout
  const [dropdownTimeout, setDropdownTimeout] = useState(null);

  // 12. Render home component
  return (
    <>
      <MobileWarningBanner />
      <div className={`min-h-screen bg-black ${isSearchInitiated ? "" : ""}`}>
        <SpotlightSearch
          isVisible={showSpotlight}
          onClose={() => setShowSpotlight(false)}
          onSearch={(query) => {
            handleSpotlightSearch(query);
          }}
          suggestedPrompts={suggestedPrompts}
          sourceFilters={{
            showGoogleDocs,
            setShowGoogleDocs,
            showNotion,
            setShowNotion,
            showMeetings,
            setShowMeetings,
            showObsidian,
            setShowObsidian,
            showGmail,
            setShowGmail,
            hasGoogleDocs,
            hasNotion,
            hasObsidian,
            hasMeetings,
            hasGmail,
            handleGoogleDocsClick,
            handleNotionClick,
            handleMeetingsClick,
            handleObsidianClick,
            handleGmailClick,
            gmailProfiles, // Pass gmailProfiles to SpotlightSearch
          }}
          customPlaceholder={randomPrompt || "Search your knowledge..."}
        />

        <div className="flex items-center justify-center gap-2">
          <button
            className={`fixed top-4 z-50 flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-all duration-200 hover:border-[#6D28D9]`}
            onClick={handleNewSearch}
          >
            <img
              src="/plus.png"
              alt="New session"
              className="inline-block h-2 w-2"
            />
            <span>New search</span>
            <div className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              ⌘K
            </div>
          </button>
        </div>

        <Popup
          isPopupOpened={isDeletionConfirmationPopupOpened}
          setIsPopupOpened={setIsDeletionConfirmationPopupOpened}
          forbidClosing={deletionConfirmation?.isWaiting}
        >
          <h3 className="popupTitle">Deleting thread?</h3>
          <p className="popupSubtitle">
            Are you sure you want to delete thread with name &quot;
            {deletionConfirmation?.deletingThread?.title}&quot;?
          </p>

          <p className="errorMessage">{deletionConfirmation?.error}</p>

          <div className="popupConfirmationButtons">
            <button
              className="mr-2 mt-2 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-transparent px-2 py-2 text-sm font-normal text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] lg:px-4 lg:py-2"
              onClick={() => setIsDeletionConfirmationPopupOpened(false)}
              disabled={deletionConfirmation?.isWaiting}
            >
              Cancel
            </button>
            <button
              className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#6D28D9] px-2 py-2 text-sm font-normal text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671] lg:px-4 lg:py-2"
              onClick={deleteThread}
              disabled={deletionConfirmation?.isWaiting}
            >
              {deletionConfirmation?.isWaiting ? (
                <>
                  <span>Deleting...</span>
                  <l-tail-chase
                    size="26"
                    speed="1.75"
                    color="white"
                  ></l-tail-chase>
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </Popup>

        <div className="fixed right-4 top-4 z-50 hidden">
          <StarButton />
        </div>
        {/* Onboarding modal disabled as requested
        {showOnboarding && (
          <OnboardingFlow
            onClose={() => setShowOnboarding(false)}
            setHasSeenOnboarding={setHasSeenOnboarding}
          />
        )}
        */}
        <div className="content">
          {!showOnboarding && (
            <div className="mb-4 flex hidden flex-col items-center justify-between rounded-lg border border-zinc-800 bg-[#1E1E24] p-4 md:flex-row">
              <div className="mb-3 flex items-center gap-3 md:mb-0">
                <div className="rounded-full bg-[#9334E9] p-2">
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
                  Connect your Google Docs, Notion, or upload Obsidian files to
                  get the most out of Amurex
                </p>
              </div>
              <a
                href="/settings?tab=personalization"
                className="inline-flex items-center justify-center rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
              >
                Connect Accounts
              </a>
            </div>
          )}

          <div className={`sidebar ${isSidebarOpened ? "sidebarActive" : ""}`}>
            <div
              className={`sidebarIcon ${isSidebarOpened ? "sidebarIconActive" : ""}`}
              onClick={() => setIsSidebarOpened((prev) => !prev)}
            >
              <img
                src={
                  isSidebarOpened ? "/sidebar-left.svg" : "/sidebar-right.svg"
                }
                alt={isSidebarOpened ? "Close sidebar" : "Open sidebar"}
                className="h-6 w-6"
              />
            </div>
            {/* <h3 className="sidebarTitle">Your sessions:</h3> */}
            <h2 className="mb-6 hidden text-2xl font-medium text-white">
              Knowledge Search
            </h2>
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
                  <div className="sidebarItem" onClick={handleNewSearch}>
                    <img
                      src="/plus.png"
                      alt="New session"
                      className="mr-2 inline-block h-3 w-3"
                    />
                    <span>New search</span>
                    <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
                      ⌘K
                    </span>
                  </div>
                  <div className="divider">
                    <div className="my-4 h-px bg-zinc-800"></div>
                  </div>

                  {/* Display grouped sessions by date */}
                  {Object.entries(groupedSidebarSessions).map(
                    ([date, threads]) => (
                      <div key={date}>
                        <div
                          className="sidebarDateHeader"
                          onClick={() => {
                            setCollapsedDays((prev) => ({
                              ...prev,
                              [date]: !prev[date],
                            }));
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{date.toUpperCase()}</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={`transition-transform duration-200 ${collapsedDays[date] ? "-rotate-90" : ""}`}
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </div>
                        </div>
                        <div
                          className={`sidebarThreads ${collapsedDays[date] ? "collapsed" : "expanded"}`}
                        >
                          {threads.map((session, index) => (
                            <div
                              className={`sidebarItem ${session.id === currentThreadId ? "sidebarItemActive" : ""}`}
                              key={session.id + index}
                              onClick={() => openThread(session.id)}
                            >
                              {session.title}
                              <img
                                src="/delete.png"
                                alt=""
                                className="deleteIcon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsDeletionConfirmationPopupOpened(true);
                                  setDeletionConfirmation((prev) => ({
                                    ...prev,
                                    deletingThread: session,
                                  }));
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </>
              )}

              {!isWaitingSessions && !sidebarSessions?.length && (
                <p className="absolute inset-0 flex items-center justify-center text-sm tracking-wide text-gray-300">
                  No sessions so far...
                </p>
              )}
            </div>
          </div>

          <div className={`chat ${isSidebarOpened ? "" : "chatSidebarClosed"}`}>
            <div className="chatContent no-scrollbar">
              {!isSearchInitiated ? (
                <div className="flex h-full flex-col items-center justify-center">
                  <h2 className="mb-4 text-2xl font-medium text-white">
                    {randomPrompt || "Search your knowledge"}
                  </h2>
                  <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-black/80 shadow-2xl">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (inputValue.trim()) {
                          // This is a new search from the main UI search box
                          sendMessage(inputValue, true);
                        }
                      }}
                      className="relative"
                    >
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
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
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Search your knowledge..."
                        className="w-full bg-transparent px-12 py-4 text-lg text-white focus:outline-none"
                        autoFocus
                      />
                      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 text-zinc-400">
                        <span className="text-xs">ESC to close</span>
                      </div>
                    </form>

                    {/* Source selection buttons */}
                    <div className="border-t border-white/10 p-4">
                      <div className="mb-2 text-xs text-zinc-500">
                        Search across
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* Gmail button - implemented with dropdown similar to AISearch component */}
                        {hasGmail ? (
                          <div
                            className="relative"
                            onMouseEnter={() => {
                              // Clear any existing timeout when mouse enters
                              if (dropdownTimeout) {
                                clearTimeout(dropdownTimeout);
                                setDropdownTimeout(null);
                              }
                              setIsGmailDropdownVisible(true);
                            }}
                            onMouseLeave={() => {
                              // Set a timeout to hide the dropdown after 300ms
                              const timeout = setTimeout(() => {
                                setIsGmailDropdownVisible(false);
                              }, 300);
                              setDropdownTimeout(timeout);
                            }}
                          >
                            <button
                              onClick={() => setShowGmail(!showGmail)}
                              className={`flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                                showGmail
                                  ? "border-[#6D28D9] bg-[#3c1671] text-white"
                                  : "bg-zinc-900 text-white"
                              } transition-all duration-200 hover:border-[#6D28D9]`}
                            >
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                                alt="Gmail"
                                className="w-3.5"
                              />
                              <span>Gmail</span>
                            </button>
                            {isGmailDropdownVisible && (
                              <div
                                className="absolute left-0 top-full mt-1 min-w-[200px] rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-zinc-400 shadow-lg"
                                onMouseEnter={() => {
                                  // Clear timeout when mouse enters dropdown
                                  if (dropdownTimeout) {
                                    clearTimeout(dropdownTimeout);
                                    setDropdownTimeout(null);
                                  }
                                }}
                                onMouseLeave={() => {
                                  // Set timeout to hide dropdown when mouse leaves
                                  const timeout = setTimeout(() => {
                                    setIsGmailDropdownVisible(false);
                                  }, 300);
                                  setDropdownTimeout(timeout);
                                }}
                              >
                                {gmailProfiles && gmailProfiles.length > 0 ? (
                                  <>
                                    {gmailProfiles.map((profile) => (
                                      <div
                                        key={profile.email}
                                        className="border-b border-zinc-800 px-3 py-2"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="truncate">
                                            {profile.email}
                                          </span>
                                          <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px]">
                                            {profile.type === "full"
                                              ? "Full"
                                              : "Gmail"}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    <div className="p-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          initiateGmailAuth(); // Use the new direct auth function
                                        }}
                                        className="flex w-full items-center justify-center gap-1.5 rounded bg-zinc-800 px-2 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-700"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <line
                                            x1="12"
                                            y1="5"
                                            x2="12"
                                            y2="19"
                                          ></line>
                                          <line
                                            x1="5"
                                            y1="12"
                                            x2="19"
                                            y2="12"
                                          ></line>
                                        </svg>
                                        Add account
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="p-3 text-center">
                                    <p className="mb-2 text-zinc-500">
                                      No Gmail accounts connected
                                    </p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        initiateGmailAuth(); // Use the new direct auth function
                                      }}
                                      className="flex w-full items-center justify-center gap-1.5 rounded bg-zinc-800 px-2 py-1.5 text-zinc-300 transition-colors hover:bg-zinc-700"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <line
                                          x1="12"
                                          y1="5"
                                          x2="12"
                                          y2="19"
                                        ></line>
                                        <line
                                          x1="5"
                                          y1="12"
                                          x2="19"
                                          y2="12"
                                        ></line>
                                      </svg>
                                      Add account
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={handleGmailClick}
                            className="relative flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[#3c1671]"
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                              alt="Gmail"
                              className="w-3.5"
                            />
                            <span>Gmail</span>
                          </button>
                        )}

                        {/* Google Docs button */}
                        {hasGoogleDocs ? (
                          <button
                            onClick={() => setShowGoogleDocs(!showGoogleDocs)}
                            className={`flex hidden items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                              showGoogleDocs
                                ? "border-[#6D28D9] bg-[#3c1671] text-white"
                                : "bg-zinc-900 text-white"
                            } transition-all duration-200 hover:border-[#6D28D9]`}
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                              alt="Google Docs"
                              className="h-3.5 w-3.5"
                            />
                            <span>Docs</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleGoogleDocsClick}
                            className="group relative flex hidden items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[#3c1671]"
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                              alt="Google Docs"
                              className="h-3.5 w-3.5"
                            />
                            <span>Docs</span>
                          </button>
                        )}

                        {/* Notion button */}
                        {hasNotion ? (
                          <button
                            onClick={() => setShowNotion(!showNotion)}
                            className={`flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                              showNotion
                                ? "border-[#6D28D9] bg-[#3c1671] text-white"
                                : "bg-zinc-900 text-white"
                            } transition-all duration-200 hover:border-[#6D28D9]`}
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                              alt="Notion"
                              className="w-3.5"
                            />
                            <span>Notion</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleNotionClick}
                            className="group relative flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[#3c1671]"
                          >
                            <img
                              src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                              alt="Notion"
                              className="w-3.5"
                            />
                            <span>Notion</span>
                          </button>
                        )}

                        {/* Obsidian button */}
                        {hasObsidian ? (
                          <button
                            onClick={() => setShowObsidian(!showObsidian)}
                            className={`flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                              showObsidian
                                ? "border-[#6D28D9] bg-[#3c1671] text-white"
                                : "bg-zinc-900 text-white"
                            } transition-all duration-200 hover:border-[#6D28D9]`}
                          >
                            <img
                              src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                              alt="Obsidian"
                              className="w-3.5"
                            />
                            <span>Obsidian</span>
                          </button>
                        ) : (
                          <button
                            onClick={handleObsidianClick}
                            className="group relative flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-all duration-200 hover:bg-[#3c1671]"
                          >
                            <img
                              src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                              alt="Obsidian"
                              className="w-3.5"
                            />
                            <span>Obsidian</span>
                          </button>
                        )}

                        {/* Meetings button */}
                        <button
                          onClick={() => setShowMeetings(!showMeetings)}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium ${
                            showMeetings && hasMeetings
                              ? "border-[#6D28D9] bg-[#3c1671] text-white"
                              : "bg-zinc-900 text-white"
                          } transition-all duration-200 hover:border-[#6D28D9] ${
                            !hasMeetings ? "cursor-not-allowed opacity-50" : ""
                          }`}
                          disabled={!hasMeetings}
                        >
                          <ChatCenteredDots className="h-3.5 w-3.5" />
                          <span>Meetings</span>
                        </button>
                      </div>
                    </div>

                    {/* Suggested prompts */}
                    {suggestedPrompts.filter((item) => item.type === "prompt")
                      .length > 0 && (
                      <div className="border-t border-white/10 p-3">
                        <div className="mb-2 px-2 text-xs text-zinc-500">
                          Suggested searches
                        </div>
                        <div className="space-y-1">
                          {suggestedPrompts
                            .filter((item) => item.type === "prompt")
                            .slice(0, 3)
                            .map((prompt, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setInputValue(prompt.text);
                                  // Don't immediately call sendMessage here
                                }}
                                className="flex w-full items-center rounded px-3 py-2 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5"
                              >
                                <svg
                                  className="mr-2 h-4 w-4 min-w-4 flex-shrink-0 text-zinc-500"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {prompt.text}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative rounded-lg border border-zinc-800">
                    <div className="space-y-6 p-4 md:p-6">
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
                          <div key={`thread-item-${index}`}>
                            <div className="threadItem space-y-6">
                              <Query
                                content={question?.query || ""}
                                sourcesTime={sourcesTime}
                                completionTime={question.completionTime}
                              />

                              <div className="answer">
                                <div>
                                  <div className="mb-1 flex items-center justify-between"></div>
                                  <div className="w-[80%] text-left font-poppins tracking-wide text-zinc-300">
                                    <GPT
                                      content={question?.reply || ""}
                                      className="text-sm"
                                    />
                                    {isSearching &&
                                      index === currentThread.length - 1 && (
                                        <span className="inline-block animate-pulse">
                                          ▋
                                        </span>
                                      )}
                                  </div>
                                </div>

                                {question?.sources?.length > 0 && (
                                  <div>
                                    <Sources
                                      content={question.sources}
                                      filters={{
                                        showGoogleDocs,
                                        showNotion,
                                        showMeetings,
                                        showObsidian,
                                        showGmail,
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="divider">
                              {index < currentThread.length - 1 && (
                                <div className="my-10 border-t border-zinc-800"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!isSearchInitiated && (
                <div className="mt-6 hidden space-y-2">
                  <div className="text-sm text-zinc-500">
                    Personalized prompt suggestions
                  </div>
                  <div className="flex flex-col gap-3">
                    {suggestedPrompts.length === 0 ? (
                      <>
                        {[1, 2, 3].map((_, index) => (
                          <div
                            key={index}
                            className="animated pulse group relative w-[70%] rounded-lg border border-zinc-800 bg-zinc-900/70 px-4 py-4 pr-16 text-left text-lg text-zinc-300 transition-all transition-colors duration-500 hover:border-[#6D28D9] hover:bg-[#3c1671]"
                          >
                            <div className="m-4 h-4 w-3/4 rounded bg-zinc-800"></div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <>{/* Suggested prompts section hidden now */}</>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="followUpInputArea">
              <InputArea
                inputValue={inputValue}
                setInputValue={setInputValue}
                sendMessage={(message) => sendMessage(message, false)} // Explicitly set isNewSearch=false for follow-up questions
                className={`w-full ${!isSearchInitiated && "hidden"}`}
                placeholder="Ask a follow-up question..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Google Docs Modal */}
      {showGoogleDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="mb-4 text-xl font-medium text-white">
              Google Access Required
            </h3>
            <p className="mb-6 text-zinc-300">
              {googleTokenVersion === "old"
                ? "Your Google access token is old and you'll have to reconnect Google to continue using it."
                : "You need to connect your Google account to access Google Docs. Please visit the settings page to connect."}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowGoogleDocsModal(false)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
              >
                Cancel
              </button>
              <a
                href="/settings?tab=personalization"
                className="rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
              >
                Go to Settings
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Broader Access Modal */}
      {showBroaderAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="mb-4 text-xl font-medium text-white">
              Broader Google Access Required
            </h3>
            <p className="mb-6 text-zinc-300">
              We need broader access to your Google account to enable Google
              Docs search. Our app is still in the verification process with
              Google. If you wish to proceed with full access, please click the
              button below.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowBroaderAccessModal(false)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
                disabled={isGoogleAuthInProgress}
              >
                Cancel
              </button>
              <button
                onClick={initiateGoogleAuth}
                className="flex items-center justify-center rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
                disabled={isGoogleAuthInProgress}
              >
                {isGoogleAuthInProgress ? (
                  <>
                    <svg
                      className="-ml-1 mr-2 h-4 w-4 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="mb-4 text-xl font-medium text-white">
              Google Access Required
            </h3>
            <p className="mb-6 text-zinc-300">
              {googleTokenVersion === "old"
                ? "Your Google access token is old and you'll have to reconnect Google to continue using it."
                : "You need to connect your Google account to access Gmail. Please visit the settings page to connect."}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowGmailModal(false)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
              >
                Cancel
              </button>
              <a
                href="/settings?tab=personalization"
                className="rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
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
  placeholder = "Search your knowledge...",
}) {
  const inputRef = useRef(null);

  // Expose the focus method to parent components
  useEffect(() => {
    // Add focus method to the DOM element for external access
    if (inputRef.current) {
      inputRef.current.focusInput = () => {
        inputRef.current.focus();
      };
    }
  }, []);

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex flex-1 items-center">
        <div className="absolute left-3 text-zinc-500 md:left-4">
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
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="text-md flex-1 rounded-l-lg border border-zinc-800 bg-black p-3 pl-10 text-zinc-300 transition-colors focus:border-[#6D28D9] focus:outline-none md:p-4 md:pl-12"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(inputValue)}
        />
      </div>
      <button
        onClick={() => sendMessage(inputValue)}
        className="rounded-r-lg border-b border-r border-t border-zinc-800 bg-black p-3 text-zinc-300 transition-colors hover:bg-[#3c1671] md:p-4"
      >
        <ArrowCircleRight size={20} className="md:h-6 md:w-6" />
      </button>
    </div>
  );
}
InputArea.displayName = "InputArea";

/* 21. Query component for displaying content */
export const Query = ({ content = "", sourcesTime, completionTime }) => {
  return (
    <div className="flex flex-col justify-between md:flex-row md:items-center">
      <div className="text-xl font-semibold text-zinc-500 md:text-3xl">
        {content}
      </div>
      <div className="mt-1 flex flex-col text-sm text-zinc-500 md:mt-0 md:items-end">
        {completionTime && (
          <div className="w-fit rounded-md px-2 text-zinc-400">
            Searched in {completionTime} seconds
          </div>
        )}
      </div>
    </div>
  );
};
Query.displayName = "Query";

/* 22. Sources component for displaying list of sources */
export const Sources = ({ content = [], filters = {} }) => {
  // Filter sources based on filter settings
  const filteredSources = useMemo(() => {
    if (!content || !Array.isArray(content)) return [];

    return content
      .filter((source) => {
        const sourceType = source.type;

        // Apply filters based on source type
        if (sourceType === "google_docs" && !filters.showGoogleDocs)
          return false;
        if (sourceType === "notion" && !filters.showNotion) return false;
        if (
          (sourceType === "msteams" || sourceType === "google_meet") &&
          !filters.showMeetings
        )
          return false;
        if (sourceType === "obsidian" && !filters.showObsidian) return false;
        if (
          (sourceType === "gmail" || sourceType === "email") &&
          !filters.showGmail
        )
          return false;

        // Include sources with unknown types
        return true;
      })
      .slice(0, 3); // Limit to top 3 sources
  }, [content, filters]);

  // Helper function to determine source icon based on 'type' directly
  const getSourceIcon = (type) => {
    switch (type) {
      case "gmail":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="w-4 flex-shrink-0"
          />
        );

      case "msteams":
        return (
          <img
            src="https://www.svgrepo.com/show/303180/microsoft-teams-logo.svg"
            alt="Microsoft Teams"
            className="w-4"
          />
        );

      case "google_meet":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Google_Meet_icon_%282020%29.svg/1024px-Google_Meet_icon_%282020%29.svg.png?20221213135236"
            alt="Google Meet"
            className="w-4"
          />
        );

      case "google_docs":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
            alt="Google Docs"
            className="w-3"
          />
        );

      case "notion":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
            alt="Notion"
            className="w-4"
          />
        );

      case "obsidian":
        return (
          <img
            src="https://obsidian.md/images/obsidian-logo-gradient.svg"
            alt="Obsidian"
            className="w-4"
          />
        );

      case "email":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="w-4 flex-shrink-0"
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
            className="h-4 w-4 text-zinc-400"
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
        <div className="text-md mb-3 flex items-center gap-2 font-medium text-[#9334E9] md:text-xl">
          {/* <GitBranch size={20} className="md:w-6 md:h-6" /> */}
          {/* <span>Sources</span> */}
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((_, index) => (
            <div
              key={index}
              className="rounded-lg border border-zinc-800 bg-black p-4"
            >
              <div className="mb-2 h-4 w-3/4 rounded bg-zinc-800"></div>
              <div className="h-3 w-1/2 rounded bg-zinc-800"></div>
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
    <div>
      {/*  */}
      <div className="text-md mb-3 flex items-center gap-2 font-medium text-[#9334E9] md:text-xl">
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
                className="sourceItem block"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* bg-black rounded-lg p-4 border border-zinc-800 hover:border-[#6D28D9] transition-colors h-[160px] relative */}
                <div className="">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute right-4 top-4 h-4 w-4 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                    {getSourceIcon(source.type)}
                    <div className="flex flex-col overflow-hidden">
                      <span className="max-w-full truncate text-xs font-normal text-zinc-400">
                        {source.type === "gmail" || source.type === "email"
                          ? "Gmail"
                          : source.type === "google_docs"
                            ? "Docs"
                            : source.type === "notion"
                              ? "Notion"
                              : source.type === "obsidian"
                                ? "Obsidian"
                                : source.type === "msteams" ||
                                    source.type === "google_meet"
                                  ? "Meeting"
                                  : "Note"}
                      </span>

                      {/* Show sender if available (for email types) */}
                      {source.from && (
                        <span className="max-w-full truncate text-xs text-zinc-400">
                          {source.from}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="line-clamp-2 overflow-hidden text-xs font-medium text-zinc-300">
                    <p>{source.title || "Document"}</p>
                  </div>
                </div>
              </a>
            );
          })}
      </div>
    </div>
  );
};
Sources.displayName = "Sources";

// 27. VectorCreation component for displaying a brief message
export const VectorCreation = ({ content = "" }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return visible ? (
    <div className="w-full p-1">
      <span className="tile-animation flex h-full flex-col items-center rounded bg-white px-6 py-2 shadow transition-shadow duration-300 hover:shadow-lg">
        <span>{content}</span>
      </span>
    </div>
  ) : null;
};
VectorCreation.displayName = "VectorCreation";

// 28. Heading component for displaying various headings
export const Heading = ({ content = "" }) => {
  return (
    <div className="text-md mb-3 flex items-center gap-2 font-medium text-[#9334E9] md:text-xl">
      <ChatCenteredDots size={20} className="md:h-6 md:w-6" />
      <span>{content}</span>
    </div>
  );
};
Heading.displayName = "Heading";

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
      .select("memory_enabled, analytics_enabled")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      return;
    }

    // Only track if memory_enabled is true
    if (userData?.memory_enabled && userData?.analytics_enabled) {
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
        className="prose text-md font prose-p:mb-4 mt-1 w-full break-words leading-8 text-white"
        remarkPlugins={[remarkGfm]}
        components={{
          a: (() => {
            let linkCounter = 0;
            const LinkComponent = ({ node, ...props }) => {
              linkCounter += 1;
              return (
                <a
                  {...props}
                  className="font-normal text-[#9334E9] transition-colors hover:text-[#7928CA]"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  (Link {linkCounter})
                </a>
              );
            };
            LinkComponent.displayName = "MarkdownLink";
            return LinkComponent;
          })(),
          p: (() => {
            const ParagraphComponent = ({ node, ...props }) => (
              <p className="mb-4" {...props} />
            );
            ParagraphComponent.displayName = "MarkdownParagraph";
            return ParagraphComponent;
          })(),
        }}
      >
        {content}
      </ReactMarkdown>

      {showEmailButton && isComplete && (
        <button
          onClick={openGmail}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
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
GPT.displayName = "GPT";

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
        <div className="my-4 flex w-full text-3xl font-bold">
          <Stack size={32} /> <span className="px-2">Follow-Up</span>
        </div>
      )}
      {followUp.map((text, index) => (
        <a
          href="#"
          key={index}
          className="w-full p-1 text-xl"
          onClick={(e) => handleFollowUpClick(text, e)}
        >
          <span>{text || ""}</span>
        </a>
      ))}
      <div ref={messagesEndReff} />
    </>
  );
};
FollowUp.displayName = "FollowUp";

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
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
      {/* Main content positioned to avoid navbar */}
      <div className="pointer-events-auto relative w-full max-w-4xl rounded-lg border border-zinc-700 bg-black bg-opacity-90 p-6">
        <div className="absolute -left-2 -top-2 rounded-full bg-zinc-700 p-2 shadow-lg">
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

        <h2 className="mb-6 text-2xl font-bold text-white">
          Welcome to Amurex!
        </h2>

        <p className="mb-6 text-zinc-300">
          To get the most out of Amurex, connect your accounts to access your
          documents and information.
        </p>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition-all duration-300 hover:border-zinc-600">
            <div className="mb-4 flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                alt="Google Docs"
                className="h-8 w-8"
              />
              <h3 className="text-xl font-medium text-white">Google Docs</h3>
            </div>
            <p className="mb-4 text-zinc-400">
              Connect your Google account to search and reference your
              documents.
            </p>
            <a
              href="/settings?tab=personalization"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
            >
              Connect Google
            </a>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition-all duration-300 hover:border-zinc-600">
            <div className="mb-4 flex items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                alt="Notion"
                className="h-8 w-8"
              />
              <h3 className="text-xl font-medium text-white">Notion</h3>
            </div>
            <p className="mb-4 text-zinc-400">
              Connect Notion to access and search your workspaces and pages.
            </p>
            <a
              href="/settings?tab=personalization"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
            >
              Connect Notion
            </a>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition-all duration-300 hover:border-zinc-600">
            <div className="mb-4 flex items-center gap-3">
              <img
                src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                alt="Obsidian"
                className="h-8 w-8"
              />
              <h3 className="text-xl font-medium text-white">Obsidian</h3>
            </div>
            <p className="mb-4 text-zinc-400">
              Upload your Obsidian vault to search through your notes.
            </p>
            <a
              href="/settings?tab=personalization"
              className="inline-flex w-full items-center justify-center rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
            >
              Upload Obsidian
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
OnboardingFlow.displayName = "OnboardingFlow";
