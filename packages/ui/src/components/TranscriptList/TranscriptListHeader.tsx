"use client";

import { BellRing } from "lucide-react";
import { IconToggle } from "@amurex/ui/components";
import { useTranscriptListStore } from "@amurex/ui/store";

export const TranscriptListHeader = () => {
  const { emailNotificationsEnabled, handleEmailNotificationsToggle } =
    useTranscriptListStore();
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-medium text-white">Meetings</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BellRing className="w-5 h-5 text-white" />
          <div className="text-white hidden sm:block">
            Email notes after meetings
          </div>
          <IconToggle
            checked={emailNotificationsEnabled}
            onChange={handleEmailNotificationsToggle}
          />
        </div>
      </div>
    </div>
  );
};
