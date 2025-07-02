"use client";

import { useTranscriptListStore } from "@amurex/ui/store";
import { Search } from "lucide-react";

export const TranscriptListSearch = () => {
  const { searchTerm, setSearchTerm } = useTranscriptListStore();
  return (
    <div className="mb-6 relative">
      <input
        type="text"
        placeholder="Search meetings..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-[#1C1C1E] text-white placeholder-zinc-400 rounded-lg px-10 py-3 border-0 focus:ring-1 focus:ring-purple-500 focus:outline-none"
      />
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
        size={18}
      />
    </div>
  );
};
