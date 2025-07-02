"use client";

import { useTranscriptListStore } from "@amurex/ui/store";
import { Card, CardContent } from "@amurex/ui/components";
import { Video } from "lucide-react";

export const MeetNotFound = () => {
  const { searchTerm, transcripts } = useTranscriptListStore();

  const filteredTranscripts = transcripts.filter((transcript) =>
    transcript.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  return (
    <>
      {filteredTranscripts.length === 0 && (
        <>
          {/* No meetings found card */}
          <div className="mt-8 mx-auto text-center">
            <h3 className="font-medium text-white text-2xl">
              No meetings found for <b>{searchTerm}</b>
            </h3>
            <p className="text-lg text-zinc-400">
              Please try a different search query, or
            </p>
            <div className="relative w-[50%] mx-auto mt-6">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9334E9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
              <Card className="bg-black border-zinc-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#9334E9]/20 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#9334E9]/30 via-[#9334E9]/20 to-[#9334E9]/30"></div>
                <CardContent className="p-4 relative text-center">
                  <div className="flex items-center gap-4 justify-center">
                    <Video className="w-6 h-6 text-[#9334E9] hidden" />
                    <div className="w-[80%]">
                      <h3 className="font-medium text-white text-2xl mb-2">
                        Try a smarter search
                      </h3>
                      <p className="text-md font-light text-white">
                        Knowledge Search - our new feature that allows you to{" "}
                        <br></br>
                        <span className="italic">
                          search your meetings, emails, and documents
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <a
                      href="/search"
                      className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors duration-200"
                    >
                      Try Knowledge Search
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </>
  );
};
