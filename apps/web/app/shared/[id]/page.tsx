"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, FileText, Calendar, Clock, Share2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@amurex/supabase";
import styles from "./TranscriptDetail.module.css";
import { TranscriptSummary } from "@amurex/ui/components";

type SharedTranscriptDetailProps = {
  params: {
    id: string;
    [key: string]: any;
  };
};

type Transcript = {
  id: string;
  meeting_id: string;
  title: string;
  date: string;
  time: string;
  summary: string;
  content: string;
  actionItems: string;
};

export default function SharedTranscriptDetail({
  params,
}: SharedTranscriptDetailProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleDownload = async (): Promise<void> => {
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

  const fetchTranscript = async (): Promise<void> => {
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
    } catch (err: any) {
      console.error("Error fetching meeting:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !transcript) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="bg-[#1C1C1E] rounded-lg p-6">
            <h1 className="text-red-500 text-xl mb-4">
              {error || "Meeting not found"}
            </h1>
            <Link
              href="https://amurex.ai"
              className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
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
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="bg-opacity-40 backdrop-blur-sm bg-[#9334E9] lg:bg-transparent px-4 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-md font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9] lg:static fixed bottom-4 left-4">
            <a
              href="https://chromewebstore.google.com/detail/amurex-early-preview/dckidmhhpnfhachdpobgfbjnhfnmddmc"
              target="_blank"
              title={`Amurex homepage`}
              className="flex items-center gap-2"
            >
              <img
                src="/amurex.png"
                alt="Amurex logo"
                className="w-8 h-8 md:w-10 md:h-10 border-2 border-white rounded-full"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm lg:text-sm text-white">
                  Amurex
                </span>
                <span className="font-medium text-sm lg:text-sm text-white">
                  The AI Meeting Copilot
                </span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2 ml-4 text-sm">
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

          <div className="flex items-center gap-2 ml-4">
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
                className="hidden lg:block z-0 rounded-[8px] bg-[#9334E9] border border-[#9334E9] px-4 py-2 text-md font-medium text-white shadow-sm hover:bg-[#3c1671] hover:border hover:border-[#9334E9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ml-2 transition duration-300 cursor-pointer"
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
              className="z-0 rounded-[8px] border-solid border border-[#9334E9] px-4 py-2 text-md font-medium text-white shadow-sm hover:bg-[#3c1671] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ml-2 transition duration-300 cursor-pointer"
            >
              {isLoggedIn ? "My Meetings" : "Sign In"}
            </a>
          </div>
        </div>

        <div className="bg-[#09090A] rounded-lg border border-zinc-800">
          <div className="p-6 border-b border-zinc-800 hidden lg:block">
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
                className=" px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-md font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
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
          <div className="p-6 border-b border-zinc-800 lg:hidden">
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
            <div className="flex gap-2 mt-2">
              <button
                className="px-2 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-sm font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
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

          <div className="p-6 space-y-6">
            {transcript.actionItems && (
              <div>
                <h2 className="text-[#9334E9] font-medium mb-3 lg:text-xl text-md">
                  Action Items
                </h2>
                <div className="bg-black rounded-lg p-4 border border-zinc-800">
                  <div
                    className={`text-zinc-300 lg:text-base text-sm ${styles.notesContent}`}
                    style={{ whiteSpace: "normal" }}
                    dangerouslySetInnerHTML={{ __html: transcript.actionItems }}
                  />
                </div>
              </div>
            )}

            {transcript.summary && (
              <div>
                <h2 className="text-[#9334E9] font-medium mb-3 lg:text-xl text-md">
                  Meeting Summary
                </h2>
                <div className="bg-black rounded-lg p-4 border border-zinc-800">
                  <div className="prose text-zinc-300 lg:text-base text-sm bg-default markdown-body">
                    {transcript.summary ? (
                      <TranscriptSummary summary={transcript.summary} />
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
