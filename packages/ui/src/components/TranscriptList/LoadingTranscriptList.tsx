"use client";

import { useTranscriptListStore } from "@amurex/ui/store";

export const LoadingTranscriptList = () => {
  const { loading } = useTranscriptListStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="p-8 mx-auto">
          <h1 className="text-2xl font-medium mb-6 text-white">Loading...</h1>
        </div>
      </div>
    );
  }
};
