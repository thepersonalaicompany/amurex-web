"use client";

import { IconToggle } from "@amurex/ui/components";
import { useEmailsPageStore } from "@amurex/ui/store";

export const EmailTaggingToggle = () => {
  const { emailTaggingEnabled, handleEmailTaggingToggle } =
    useEmailsPageStore();
  return (
    <>
      <span className="hidden text-white text-sm">Enable email tagging</span>
      <IconToggle
        checked={emailTaggingEnabled}
        onChange={handleEmailTaggingToggle}
      />
    </>
  );
};
