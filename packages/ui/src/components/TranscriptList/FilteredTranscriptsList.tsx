"use client";

import { useTranscriptListStore } from "@amurex/ui/store";
import { Calendar, Clock, FileText } from "lucide-react";
import Link from "next/link";

export const FilteredTranscriptList = () => {
  const { filter, transcripts, searchTerm } = useTranscriptListStore();

  const filteredTranscripts = transcripts.filter((transcript) =>
    transcript.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {filteredTranscripts.map((transcript) => (
        <Link key={transcript.id} href={`/meetings/${transcript.id}`}>
          <div className="bg-[#09090A] border border-zinc-800 hover:bg-[#27272A] transition-colors rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-[#9334E9]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-white font-medium mb-2">
                  {transcript.title}
                </h2>
                {filter !== "personal" && (
                  <div className="text-purple-500 text-sm mb-2">
                    {transcript.team_name}
                  </div>
                )}
                <div className="flex items-center text-zinc-400 text-sm gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{transcript.date}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center text-zinc-400 text-sm gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{transcript.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
