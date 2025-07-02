"use client";

import { useSearchStore } from "@amurex/ui/store";
import { ChatCenteredDots } from "@phosphor-icons/react";
import { InputArea } from "./InputArea";
import { Query } from "./Query";
import { GPTSearch } from "./GPTSearch";
import { Sources } from "./Sources";

export const SearchPanel = () => {
  const {
    showOnboarding,
    isSidebarOpened,
    setIsSidebarOpened,
    isWaitingSessions,
    sidebarSessions,
    groupedSidebarSessions,
    handleNewSearch,
    setCollapsedDays,
    collapsedDays,
    openThread,
    setIsDeletionConfirmationPopupOpened,
    currentThreadId,
    setDeletionConfirmation,
    deletionConfirmation,
    isSearchInitiated,
    randomPrompt,
    inputValue,
    sendMessage,
    setInputValue,
    hasGmail,
    dropDownTimeout: dropdownTimeout,
    setDropDownTimeout: setDropdownTimeout,
    setIsGmailDropDownVisible: setIsGmailDropdownVisible,
    showGmail,
    setShowGmail,
    isGmailDropDownVisible: isGmailDropdownVisible,
    gmailProfiles,
    initiateGmailAuth,
    handleGmailClick,
    handleGoogleDocsClick,
    hasGoogleDocs,
    setShowGoogleDocs,
    showGoogleDocs,
    hasNotion,
    setShowNotion,
    showNotion,
    hasObsidian,
    setShowObsidian,
    showObsidian,
    handleObsidianClick,
    showMeetings,
    setShowMeetings,
    hasMeetings,
    handleNotionClick,
    suggestedPrompts,
    currentThread,
    isSearching,
  } = useSearchStore();

  return (
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
              Connect your Google Docs, Notion, or upload Obsidian files to get
              the most out of Amurex
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

      <div className={`sidebar ${isSidebarOpened ? "sidebarActive" : ""}`}>
        <div
          className={`sidebarIcon ${isSidebarOpened ? "sidebarIconActive" : ""}`}
          onClick={() => setIsSidebarOpened(!isSidebarOpened)}
        >
          <img
            src={isSidebarOpened ? "/sidebar-left.svg" : "/sidebar-right.svg"}
            alt={isSidebarOpened ? "Close sidebar" : "Open sidebar"}
            className="w-6 h-6"
          />
        </div>
        {/* <h3 className="sidebarTitle">Your sessions:</h3> */}
        <h2 className="hidden text-2xl font-medium text-white mb-6">
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
                  className="w-3 h-3 mr-2 inline-block"
                />
                <span>New search</span>
                <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400">
                  ⌘K
                </span>
              </div>
              <div className="divider">
                <div className="h-px bg-zinc-800 my-4"></div>
              </div>

              {/* Display grouped sessions by date */}
              {Object.entries(groupedSidebarSessions).map(([date, threads]) => (
                <div key={date}>
                  <div
                    className="sidebarDateHeader"
                    onClick={() => {
                      setCollapsedDays({
                        ...collapsedDays,
                        [date]: !collapsedDays[date],
                      });
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
                            setDeletionConfirmation({
                              ...deletionConfirmation,
                              deletingThread: {
                                title: session.title,
                                id: session.id,
                              },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
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

      <div className={`chat ${isSidebarOpened ? "" : "chatSidebarClosed"}`}>
        <div className="chatContent no-scrollbar">
          {!isSearchInitiated ? (
            <div className="h-full flex flex-col items-center justify-center">
              <h2 className="text-2xl font-medium text-white mb-4">
                {randomPrompt || "Search your knowledge"}
              </h2>
              <div className="w-full max-w-2xl bg-black/80 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
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
                    className="w-full py-4 px-12 bg-transparent text-white text-lg focus:outline-none"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 flex items-center gap-2">
                    <span className="text-xs">ESC to close</span>
                  </div>
                </form>

                {/* Source selection buttons */}
                <div className="p-4 border-t border-white/10">
                  <div className="text-xs text-zinc-500 mb-2">
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
                                      <span className="truncate">
                                        {profile.email}
                                      </span>
                                      <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 rounded text-[10px]">
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
                {suggestedPrompts.filter((item) => item.type === "prompt")
                  .length > 0 && (
                  <div className="p-3 border-t border-white/10">
                    <div className="text-xs text-zinc-500 mb-2 px-2">
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
                              if (prompt.text) {
                                setInputValue(prompt.text);
                              }
                              // Don't immediately call sendMessage here
                            }}
                            className="w-full text-left px-3 py-2 text-zinc-300 rounded transition-colors text-sm flex items-center hover:bg-white/5"
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
          ) : (
            <>
              <div className="rounded-lg border border-zinc-800 relative">
                <div className="p-4 md:p-6 space-y-6">
                  <div className="w-full">
                    <InputArea
                      className={`w-full ${isSearchInitiated && "hidden"}`}
                    />
                  </div>

                  <div>
                    {currentThread?.map((question, index) => (
                      <div key={`thread-item-${index}`}>
                        <div className="space-y-6 threadItem">
                          <Query content={question?.query || ""} />

                          <div className="answer">
                            <div>
                              <div className="flex justify-between items-center mb-1"></div>
                              <div className="text-zinc-300 text-left w-[80%] font-poppins tracking-wide">
                                <GPTSearch
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
                            <div className="border-t border-zinc-800 my-10"></div>
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
            <div className="mt-6 space-y-2 hidden">
              <div className="text-zinc-500 text-sm">
                Personalized prompt suggestions
              </div>
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
                  <>{/* Suggested prompts section hidden now */}</>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="followUpInputArea">
          <InputArea
            // Explicitly set isNewSearch=false for follow-up questions
            className={`w-full ${!isSearchInitiated && "hidden"}`}
            placeholder="Ask a follow-up question..."
          />
        </div>
      </div>
    </div>
  );
};
