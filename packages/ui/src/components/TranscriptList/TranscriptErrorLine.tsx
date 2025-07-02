"use client";

import { useTranscriptListStore } from "@amurex/ui/store";

export const TranscriptErrorLine = () => {
  const { error } = useTranscriptListStore();
  return error ? (
    <div className="text-red-500 mb-4">{String(error)}</div>
  ) : null;
};
