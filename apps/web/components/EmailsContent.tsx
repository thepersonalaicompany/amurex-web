"use client";

import {
  AddAccountPopup,
  EmailsHeader,
  EmailsMainContent,
  MobileWarningBanner,
} from "@amurex/ui/components";
import { EmailsContentClient } from "./EmailsContent.client";

export const EmailsContent = () => {
  return (
    <div className="min-h-screen bg-black">
      <EmailsContentClient>
        <MobileWarningBanner />
        {/* Header Section */}
        <EmailsHeader />
        {/* Main Content Area */}
        <EmailsMainContent />

        {/* Add Account Popup */}
        <AddAccountPopup />
      </EmailsContentClient>
    </div>
  );
};
