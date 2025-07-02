"use client";

import { useSearchStore } from "@amurex/ui/store";
import { ChatCenteredDots } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

export const SpotlightSearch = () => {
  const {
    setShowSpotlight,
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
    handleObsidianClick,
    handleGmailClick,
    gmailProfiles,
    handleSpotlightSearch,
    inputValue,
    setInputValue,
    randomPrompt,
    setIsGmailDropDownVisible: setIsGmailDropdownVisible,
    isGmailDropDownVisible: isGmailDropdownVisible,
    initiateGmailAuth,
    suggestedPrompts,
    dropDownTimeout: dropdownTimeout,
    setDropDownTimeout: setDropdownTimeout,
    selectedSuggestion,
    setSelectedSuggestion,
    showSpotlight,
    setQuery,
  } = useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const onSearch = () => {
    handleSpotlightSearch();
  };

  const onClose = () => {
    setShowSpotlight(false);
  };

  // Reset state when popup visibility changes
  useEffect(() => {
    if (showSpotlight) {
      setInputValue("");
      setSelectedSuggestion(-1);
    }
  }, [showSpotlight]);

  useEffect(() => {
    // Focus input when popup becomes visible
    if (showSpotlight && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSpotlight]);

  useEffect(() => {
    if (!SpotlightSearch) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const filteredPrompts = suggestedPrompts
        .filter((item) => item.type === "prompt")
        .slice(0, 3);

      if (e.key === `Escape`) {
        onClose();
      } else if (e.key === `ArrowDown`) {
        e.preventDefault();
        setSelectedSuggestion(
          selectedSuggestion < filteredPrompts.length - 1
            ? selectedSuggestion + 1
            : selectedSuggestion,
        );
      } else if (e.key === `Enter`) {
        if (
          selectedSuggestion >= 0 &&
          selectedSuggestion < filteredPrompts.length
        ) {
          e.preventDefault();
          setQuery(filteredPrompts[selectedSuggestion]?.prompt);
          onSearch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
  }, [showSpotlight, onClose, selectedSuggestion, suggestedPrompts, onSearch]);

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("spotlight-overlay")) {
      onClose();
    }
  };

  const filteredPrompts = suggestedPrompts
    .filter((item) => item.type === "prompt")
    .slice(0, 3);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch();
    }
  };

  if (!showSpotlight) return null;

  return (
    <div
      className="spotlight-overlay fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleOutsideClick}
    >
      <div className="spotlight-container w-full max-w-2xl bg-black/80 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
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
            placeholder={randomPrompt || "Search your knowledge..."}
            className="w-full py-4 px-12 bg-transparent text-white text-lg focus:outline-none"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 flex items-center gap-2">
            <span className="text-xs">ESC to close</span>
          </div>
        </form>

        {/* Source selection buttons */}
        <div className="p-4 border-t border-white/10">
          <div className="text-xs text-zinc-500 mb-2">Search across</div>
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
                  className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-white/10 ${
                    showGmail
                      ? "bg-[#3c1671] text-white border-[#6D28D9]"
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
                    className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg text-xs text-zinc-400 min-w-[200px]"
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
                            className="px-3 py-2 border-b border-zinc-800"
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{profile.email}</span>
                              <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 rounded text-[10px]">
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
                            className="w-full px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
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
                        <p className="text-zinc-500 mb-2">
                          No Gmail accounts connected
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateGmailAuth(); // Use the new direct auth function
                          }}
                          className="w-full px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
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
                className="px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative"
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
                className={`hidden px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-white/10 ${
                  showGoogleDocs
                    ? "bg-[#3c1671] text-white border-[#6D28D9]"
                    : "bg-zinc-900 text-white"
                } transition-all duration-200 hover:border-[#6D28D9]`}
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                  alt="Google Docs"
                  className="w-3.5 h-3.5"
                />
                <span>Docs</span>
              </button>
            ) : (
              <button
                onClick={handleGoogleDocsClick}
                className="hidden px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                  alt="Google Docs"
                  className="w-3.5 h-3.5"
                />
                <span>Docs</span>
              </button>
            )}

            {/* Notion button */}
            {hasNotion ? (
              <button
                onClick={() => setShowNotion(!showNotion)}
                className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-white/10 ${
                  showNotion
                    ? "bg-[#3c1671] text-white border-[#6D28D9]"
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
                className="px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
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
                className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-white/10 ${
                  showObsidian
                    ? "bg-[#3c1671] text-white border-[#6D28D9]"
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
                className="px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-white/10 bg-zinc-900 text-white hover:bg-[#3c1671] transition-all duration-200 relative group"
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
              className={`px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium border border-white/10 ${
                showMeetings && hasMeetings
                  ? "bg-[#3c1671] text-white border-[#6D28D9]"
                  : "bg-zinc-900 text-white"
              } transition-all duration-200 hover:border-[#6D28D9] ${
                !hasMeetings ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!hasMeetings}
            >
              <ChatCenteredDots className="w-3.5 h-3.5" />
              <span>Meetings</span>
            </button>
          </div>
        </div>

        {/* Suggested prompts */}
        {filteredPrompts.length > 0 && (
          <div className="p-3 border-t border-white/10">
            <div className="text-xs text-zinc-500 mb-2 px-2">
              Suggested searches
            </div>
            <div className="space-y-1">
              {filteredPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputValue(prompt.text || "");
                  }}
                  className={`w-full text-left px-3 py-2 text-zinc-300 rounded transition-colors text-sm flex items-center ${selectedSuggestion === idx ? "bg-white/10" : "hover:bg-white/5"}`}
                  onMouseEnter={() => setSelectedSuggestion(idx)}
                  onMouseLeave={() => setSelectedSuggestion(-1)}
                >
                  <svg
                    className="h-4 w-4 min-w-4 flex-shrink-0 mr-2 text-zinc-500"
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
