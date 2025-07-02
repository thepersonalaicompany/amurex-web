"use client";

import { useTranscriptDetailStore } from "@amurex/ui/store";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const MeetErrorFallback = () => {
  const { error } = useTranscriptDetailStore();

  return (
    <div className="min-h-screen bg-[#09090B]">
      <div className="p-6 mx-auto">
        <div className="bg-[#1C1C1E] rounded-lg p-6">
          <h1 className="text-red-500 text-xl mb-4">
            {typeof error === "string" ? error : "Transcript not found"}
          </h1>
          <Link
            href="/meetings"
            className="text-[#9334E9] hover:text-purple-300 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Meetings
          </Link>
        </div>
      </div>
    </div>
  );
};
