"use client";

import { useTranscriptListStore } from "@amurex/ui/store";

export const TranscriptListFilter = () => {
  const { filter, setFilter, userTeams, transcripts, searchTerm } =
    useTranscriptListStore();

  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap bg-[#1C1C1E] p-1 rounded-lg w-fit hidden">
      <label
        className={`relative px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
          filter === "personal"
            ? "bg-[#9334E9] text-[#FAFAFA] hover:cursor-not-allowed"
            : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        <input
          type="radio"
          value="personal"
          checked={filter === "personal"}
          onChange={(e) => setFilter(e.target.value)}
          className="absolute opacity-0"
        />
        <span className="text-sm font-medium">Personal</span>
      </label>
      {userTeams.map((team) => (
        <label
          key={team.team_id}
          className={`relative px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
            filter === team.team_id
              ? "bg-[#9334E9] text-[#FAFAFA] hover:cursor-not-allowed"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <input
            type="radio"
            value={team.team_id}
            checked={filter === team.team_id}
            onChange={(e) => setFilter(e.target.value)}
            className="absolute opacity-0"
          />
          <span className="text-sm font-medium">
            {team.teams?.team_name || "Unknown Team"}
          </span>
        </label>
      ))}
    </div>
  );
};
