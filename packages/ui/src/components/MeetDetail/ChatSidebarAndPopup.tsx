"use client";

import { useTranscriptDetailStore } from "@amurex/ui/store";
import React from "react";

export const ChatSidebarAndPopup = ({
  messagesEndRef,
}: {
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) => {
  const {
    isChatOpen,
    isMobile,
    handleDownload,
    setIsChatOpen,
    chatMessages,
    isSending,
    handleChatSubmit,
    chatInput,
    setChatInput,
  } = useTranscriptDetailStore();
  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full w-[450px] bg-black border-l border-zinc-800 transform transition-transform duration-300 ease-in-out z-50 lg:block ${
          isChatOpen ? "translate-x-0" : "translate-x-full"
        } ${isMobile ? "hidden" : ""}`}
      >
        <div className="flex flex-col h-full">
          {/* Chat Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <button
              className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-normal border border-white/10 bg-zinc-900 text-white transition-all duration-200 hover:border-[#6D28D9]"
              onClick={handleDownload}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>View transcript</span>
            </button>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-zinc-400 hover:bg-[#27272A] transition-colors"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-poppins">
            <div className={`flex justify-start`}>
              <div className={`max-w-[80%] rounded-3xl text-md text-white`}>
                Hey, I&apos;m ready to help you with any questions you have
                about this meeting. What can I do for you?
              </div>
            </div>

            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-3xl text-md ${
                    message.role === "user"
                      ? "bg-[#6D28D9] text-white px-4 py-2"
                      : "text-white"
                  }`}
                >
                  {message.content}
                  {isSending &&
                    index === chatMessages.length - 1 &&
                    message.role === "assistant" && (
                      <span className="inline-block animate-pulse">▋</span>
                    )}
                </div>
              </div>
            ))}
            {isSending && chatMessages.length === 0 && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-3xl text-md text-white">
                  <span className="inline-block animate-pulse">▋</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleChatSubmit}
            className="p-4 border-t border-zinc-800 mr-14"
          >
            <div className="flex items-center w-full">
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
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-3 md:p-4 pl-10 md:pl-12 text-md rounded-l-lg focus:outline-none bg-black border border-zinc-800 text-zinc-300 focus:border-[#6D28D9] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!chatInput.trim() || isSending}
                className={`p-3 md:p-4 rounded-r-lg bg-black border-t border-r border-b border-zinc-800 text-zinc-300 ${
                  !chatInput.trim() || isSending
                    ? "cursor-not-allowed"
                    : "hover:bg-[#3c1671]"
                } transition-colors`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                  className="md:w-6 md:h-6"
                >
                  <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm45.66-93.66a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32-11.32L148.69,136H88a8,8,0,0,1,0-16h60.69l-18.35-18.34a8,8,0,0,1,11.32-11.32Z"></path>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
