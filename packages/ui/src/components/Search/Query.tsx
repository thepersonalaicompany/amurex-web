"use client";

import { useSearchStore } from "@amurex/ui/store";

export const Query = ({ content = "" }) => {
  const { completionTime } = useSearchStore();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between">
      <div className="text-xl md:text-3xl font-semibold text-zinc-500">
        {content}
      </div>
      <div className="text-sm text-zinc-500 mt-1 md:mt-0 flex flex-col md:items-end">
        {completionTime && (
          <div className="px-2 rounded-md text-zinc-400 w-fit">
            Searched in {completionTime} seconds
          </div>
        )}
      </div>
    </div>
  );
};
Query.displayName = "Query";
