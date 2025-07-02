"use client";

import { Button } from "@amurex/ui/components";
import { useEmailsPageStore } from "@amurex/ui/store";

export const AddEmailAccountButton = () => {
  const { setShowAddAccountPopup } = useEmailsPageStore();
  return (
    <div className="flex items-center gap-2 mx-6">
      <Button
        variant="outline"
        className="text-xs font-medium bg-[#3c1671] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] border border-white/10 px-4 py-2"
        onClick={() => setShowAddAccountPopup(true)}
      >
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span className="ml-2">Add Account</span>
        </div>
      </Button>
    </div>
  );
};
