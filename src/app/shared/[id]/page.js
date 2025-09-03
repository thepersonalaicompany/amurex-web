"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Download,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import styles from "./TranscriptDetail.module.css";
import ReactMarkdown from "react-markdown";

export default function SharedTranscriptDetail({ params }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [transcript, setTranscript] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if the user is logged in
    const checkLoginStatus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    fetchTranscript();
  }, [params.id]);

  const handleDownload = async () => {
    if (transcript && transcript.content) {
      try {
        const response = await fetch(transcript.content);
        if (!response.ok) throw new Error("Network response was not ok");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Preprocess the meeting title for the file name
        const fileName = transcript.title
          .toLowerCase()
          .replace(/\s+/g, "_") // Replace spaces with underscores
          .replace(/[^\w_]/g, ""); // Remove special characters

        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName}.txt`; // Use the processed title as the file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error downloading the file:", error);
      }
    }
  };

  const fetchTranscript = async () => {
    try {
      const response = await fetch(`/api/meetings/${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch meeting");
      }

      const data = await response.json();

      setTranscript({
        id: data.id,
        meeting_id: data.meeting_id,
        title: data.meeting_title || "Untitled Meeting",
        date: new Date(data.created_at).toLocaleDateString(),
        time: new Date(data.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        summary: data.summary,
        content: data.transcript || "",
        actionItems: data.action_items || "",
      });
    } catch (err) {
      console.error("Error fetching meeting:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="mx-auto max-w-7xl p-6">
          <h1 className="text-2xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !transcript) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="mx-auto max-w-7xl p-6">
          <div className="rounded-lg bg-[#1C1C1E] p-6">
            <h1 className="mb-4 text-xl text-red-500">
              {error || "Meeting not found"}
            </h1>
            <Link
              href="https://amurex.ai"
              className="flex items-center gap-2 text-purple-400 transition-colors hover:text-purple-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Try Amurex - The AI Meeting Copilot
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-md fixed bottom-4 left-4 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border border-white/10 bg-[#9334E9] bg-opacity-40 px-4 py-2 font-medium text-[#FAFAFA] backdrop-blur-sm transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671] lg:static lg:bg-transparent">
            <a
              href="https://chromewebstore.google.com/detail/amurex-early-preview/dckidmhhpnfhachdpobgfbjnhfnmddmc"
              target="_blank"
              title={`Amurex homepage`}
              className="flex items-center gap-2"
            >
              <img
                src="/amurex.png"
                alt="Amurex logo"
                className="h-8 w-8 rounded-full border-2 border-white md:h-10 md:w-10"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white lg:text-sm">
                  Amurex
                </span>
                <span className="text-sm font-medium text-white lg:text-sm">
                  The AI Meeting Copilot
                </span>
              </div>
            </a>
          </div>

          <div className="ml-4 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-gray-400">
                <Calendar className="h-4 w-4" />
                {transcript.date}
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="h-4 w-4" />
                {transcript.time}
              </span>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-2">
            {!isLoggedIn && (
              <a
                id="try-button"
                onClick={() => {
                  // track("download_button_clicked");
                  // Create link to download zip
                  const link = document.createElement("a");
                  link.target = "_blank";
                  link.href =
                    "https://chromewebstore.google.com/detail/amurex/dckidmhhpnfhachdpobgfbjnhfnmddmc"; // Place your zip file in the public/downloads folder
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="text-md z-0 ml-2 hidden cursor-pointer rounded-[8px] border border-[#9334E9] bg-[#9334E9] px-4 py-2 font-medium text-white shadow-sm transition duration-300 hover:border hover:border-[#9334E9] hover:bg-[#3c1671] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 lg:block"
              >
                Try Now
              </a>
            )}

            <a
              id="signin-button"
              onClick={() => {
                const link = document.createElement("a");
                link.target = "_blank";
                link.href = isLoggedIn ? "/search" : "/web_app/signin";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="text-md z-0 ml-2 cursor-pointer rounded-[8px] border border-solid border-[#9334E9] px-4 py-2 font-medium text-white shadow-sm transition duration-300 hover:bg-[#3c1671] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              {isLoggedIn ? "My Meetings" : "Sign In"}
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-[#09090A]">
          <div className="hidden border-b border-zinc-800 p-6 lg:block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-[#9334E9]">
                  <FileText className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-medium text-white">
                  {transcript.title}
                </h1>
              </div>
              <button
                id="download-transcript"
                className="text-md inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#9334E9] px-4 py-2 font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671]"
                onClick={handleDownload}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15V16C21 18.2091 19.2091 20 17 20H7C4.79086 20 3 18.2091 3 16V15M12 3V16M12 16L16 11M12 16L8 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Download transcript</span>
              </button>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="border-b border-zinc-800 p-6 lg:hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-[#9334E9]">
                  <FileText className="h-5 w-5" />
                </div>
                <h1 className="text-md font-medium text-white">
                  {transcript.title}
                </h1>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border border-white/10 px-2 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671]"
                onClick={handleDownload}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15V16C21 18.2091 19.2091 20 17 20H7C4.79086 20 3 18.2091 3 16V15M12 3V16M12 16L16 11M12 16L8 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Download transcript</span>
              </button>
            </div>
          </div>

          <div className="space-y-6 p-6">
            {transcript.actionItems && (
              <div>
                <h2 className="text-md mb-3 font-medium text-[#9334E9] lg:text-xl">
                  Action Items
                </h2>
                <div className="rounded-lg border border-zinc-800 bg-black p-4">
                  <div
                    className={`text-sm text-zinc-300 lg:text-base ${styles.notesContent}`}
                    style={{ whiteSpace: "normal" }}
                    dangerouslySetInnerHTML={{ __html: transcript.actionItems }}
                  />
                </div>
              </div>
            )}

            {transcript.summary && (
              <div>
                <h2 className="text-md mb-3 font-medium text-[#9334E9] lg:text-xl">
                  Meeting Summary
                </h2>
                <div className="rounded-lg border border-zinc-800 bg-black p-4">
                  <div className="prose bg-default markdown-body text-sm text-zinc-300 lg:text-base">
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
                            <ul className="mb-2 list-disc pl-5" {...props} />
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
