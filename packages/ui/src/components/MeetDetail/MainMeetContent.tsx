"use client";

import { useTranscriptDetailStore } from "@amurex/ui/store";
import { Switch } from "@radix-ui/react-switch";
import { ArrowLeft, Calendar, Clock, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export const MainMeetContent = ({
  params,
  styles,
}: {
  params: { id: string };
  styles: {
    readonly [key: string]: string;
  };
}) => {
  const router = useRouter();
  const {
    transcript,
    memoryEnabled,
    isMobile,
    isChatOpen,
    setIsChatOpen,
    copyButtonText,
    handleCopyLink,
    copyActionItemsText,
    setCopyActionItemsText,
    copyMeetingSummaryText,
    setCopyMeetingSummaryText,
    handleSummaryClick,
    handleActionItemClick,
  } = useTranscriptDetailStore();
  return (
    <div
      className={`transition-all duration-300 ${isChatOpen && !isMobile ? "mr-[450px]" : ""}`}
    >
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/meetings"
          className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 lg:text-base text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Meetings
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-zinc-400 text-sm">
            <div className="hidden items-center gap-2 border-r border-zinc-800 pr-4 hidden">
              <span className="text-zinc-400">Memory</span>
              <Switch
                checked={memoryEnabled}
                disabled={true}
                className="data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-zinc-700"
                aria-label="Toggle memory"
              />
            </div>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {transcript?.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {transcript?.time}
            </span>
          </div>
        </div>
      </div>

      {/* mobile  */}
      <div className="flex flex-col items-center justify-center mx-auto mb-4 md:hidden">
        <button
          className="flex md:hidden mx-auto mt-2 px-4 py-2 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-normal border border-white/10 bg-[#6D28D9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
          onClick={() => setIsChatOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Chat with the meeting</span>
        </button>
      </div>

      {/* desktop */}
      <div className="flex flex-col items-center justify-center mx-auto mb-4 hidden lg:flex">
        <span className="text-white text-sm md:text-lg font-medium">
          Make this meeting public
        </span>
        <div className="flex items-center justify-center gap-4 mx-auto w-[100%]">
          <input
            type="text"
            value={`${window.location.host.includes("localhost") ? "http://" : "https://"}${window.location.host}/shared/${params.id}`}
            readOnly
            className="hidden md:block w-[30%] mt-2 px-4 py-2 border border-[#27272A] rounded-lg bg-transparent text-zinc-400 text-sm focus:outline-none"
            onClick={(e) => (e.target as HTMLInputElement).select()}
            style={{
              userSelect: "none",
              outline: "none",
            }}
          />
          <button
            className="mt-2 lg:px-4 lg:py-2 px-4 py-2 inline-flex items-center justify-center gap-2 rounded-lg text-xs md:text-md font-normal border border-white/10 bg-[#6D28D9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
            onClick={() => handleCopyLink(params, router)}
          >
            <svg
              width="15"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 4V7H19"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{copyButtonText}</span>
          </button>
        </div>
      </div>
      <div className="bg-black rounded-xl border border-zinc-800">
        <div className="p-6 border-b border-zinc-800 hidden lg:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="hidden text-[#6D28D9]">
                <FileText className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-medium text-white">
                {transcript?.title}
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                className={`${isChatOpen ? "hidden" : ""} bg-[#6D28D9] lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-lg text-md font-normal border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]`}
                onClick={() => setIsChatOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Chat with the meeting
              </button>
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="p-6 border-b border-zinc-800 lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-[#9334E9]">
                <FileText className="h-5 w-5" />
              </div>
              <h1 className="text-md font-medium text-white">
                {transcript?.title}
              </h1>
            </div>
          </div>
          <button
            className="mt-2 lg:px-4 lg:py-2 px-4 py-2 inline-flex items-center justify-center gap-2 rounded-lg text-xs md:text-md font-normal border border-white/10 bg-[#6D28D9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
            onClick={() => handleCopyLink(params, router)}
          >
            <svg
              width="15"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 4V7H19"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{copyButtonText}</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {transcript?.actionItems && (
            <div onClick={() => handleActionItemClick(params)}>
              <div className="flex items-center justify-between">
                <h2 className="text-[#6D28D9] font-normal mb-3 lg:text-xl text-md">
                  Action Items
                </h2>
              </div>

              <div className="bg-black rounded-lg p-4 border border-zinc-800">
                <div
                  className={`text-zinc-300 lg:text-base text-sm ${styles.notesContent}`}
                  style={{ whiteSpace: "normal" }} // Ensure normal whitespace handling
                  dangerouslySetInnerHTML={{
                    __html: transcript.actionItems,
                  }}
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(transcript.actionItems);
                  setCopyActionItemsText("Copied!");
                  setTimeout(() => setCopyActionItemsText("Copy"), 3000);
                }}
                className="mt-4 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 bg-zinc-900 text-white transition-all duration-200 hover:border-[#6D28D9]"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M16 4V7H19"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </svg>
                <span className="text-xs lg:text-sm">
                  {copyActionItemsText}
                </span>
              </button>
            </div>
          )}

          {transcript?.summary && (
            <div onClick={() => handleSummaryClick(params, router)}>
              <div className="flex items-center justify-between">
                <h2 className="text-[#6D28D9] font-medium mb-3 lg:text-xl text-md">
                  Meeting Summary
                </h2>
              </div>

              <div className="bg-black rounded-lg p-4 border border-zinc-800">
                <div className="prose text-zinc-300 lg:text-base text-sm bg-default markdown-body">
                  {transcript.summary ? (
                    <ReactMarkdown
                      components={{
                        h3: ({ node, ...props }) => (
                          <h3 className="mb-1 text-lg font-bold" {...props} />
                        ),
                        p: ({ node, ...props }) => (
                          <p className="mb-2" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc pl-5 mb-2" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="mb-1 ml-4" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold" {...props} />
                        ),
                      }}
                    >
                      {transcript.summary}
                    </ReactMarkdown>
                  ) : (
                    "No meeting notes available."
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(transcript.summary);
                  setCopyMeetingSummaryText("Copied!");
                  setTimeout(() => setCopyMeetingSummaryText("Copy"), 3000);
                }}
                className="mt-4 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 bg-zinc-900 text-white transition-all duration-200 hover:border-[#6D28D9]"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M16 4V7H19"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                  <path
                    d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  ></path>
                </svg>
                <span className="text-xs lg:text-sm">
                  {copyMeetingSummaryText}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
