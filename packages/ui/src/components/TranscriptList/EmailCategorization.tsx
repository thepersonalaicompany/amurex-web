"use client";

import { useTranscriptListStore } from "@amurex/ui/store";
import { EmailCategorizationCard } from "./EmailCategorizationCard";
import { MeetPreview } from "./MeetPreview";

export const EmailCategorization = () => {
  const { transcripts } = useTranscriptListStore();
  return (
    <>
      {transcripts.length === 0 && (
        <>
          {/* Email categorization card */}
          <EmailCategorizationCard />
          {/* Google Meet preview */}
          <div className="mt-8 mx-auto max-w-4xl">
            <MeetPreview />
          </div>
        </>
      )}
    </>
  );
};
