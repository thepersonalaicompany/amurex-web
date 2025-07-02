"use client";

import { useEmailsPageStore } from "@amurex/ui/store";
import { Button, PROVIDER_ICONS } from "@amurex/ui/components";

export const EmailTaggingAction = () => {
  const { emailTaggingEnabled, isProcessingEmails, processGmailLabels } =
    useEmailsPageStore();
  return (
    <>
      {emailTaggingEnabled && (
        <div className="hidden flex items-center gap-2 mx-6">
          <Button
            variant="outline"
            className="text-xs font-medium bg-[#3c1671] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] border border-white/10 px-4 py-2"
            onClick={processGmailLabels}
            disabled={isProcessingEmails}
          >
            {isProcessingEmails ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Processing...</span>
              </>
            ) : (
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                </svg>
                Categorize new emails
              </div>
            )}
          </Button>

          <Button
            variant="outline"
            className="text-xs font-normal bg-[#3c1671] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] border border-white/10 px-4 py-2"
            onClick={() => window.open("https://mail.google.com", "_blank")}
          >
            <div className="flex items-center">
              <img
                src={PROVIDER_ICONS.gmail}
                alt="Gmail"
                className="w-3 mr-2"
              />
              Open Gmail
            </div>
          </Button>
        </div>
      )}
    </>
  );
};
