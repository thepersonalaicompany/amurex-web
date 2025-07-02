import { PROVIDER_ICONS } from "@amurex/ui/components";
import {
  AddEmailAccountButton,
  ConnectedGmailAccountsSection,
  EmailCategoriesSection,
  EmailTaggingAction,
  EmailTaggingToggle,
} from "./lib";

export const EmailsMainContent = () => {
  return (
    <div className="content p-8 pt-0 flex gap-6">
      {/* Left Column - Categorize emails with AI */}
      <div className="w-[50%]">
        <div className="rounded-xl border text-card-foreground shadow bg-black/80 border-white/10">
          <div className="flex flex-col">
            <div className="flex flex-row justify-between gap-2 border-b border-white/10 bg-zinc-800/50 rounded-t-xl">
              <div className="flex items-center gap-4 px-6 py-4">
                <img
                  src={PROVIDER_ICONS.gmail}
                  alt="Gmail"
                  className="hidden w-8"
                />
                <div>
                  <h2 className="font-medium text-white text-[14px]">
                    Categorize emails with AI
                  </h2>
                  <p className="text-xs text-zinc-400 max-w-72">
                    Your inbox will be organized into categories
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <EmailTaggingToggle />
                  </div>
                </div>
              </div>
              <EmailTaggingAction />
            </div>
            <EmailCategoriesSection />
          </div>
        </div>
      </div>

      {/* Right Column - Connected Gmail Accounts */}
      <div className="w-[50%]">
        <div className="w-full rounded-xl border text-card-foreground shadow bg-black/80 border-white/10 mb-6">
          <div className="flex flex-col">
            <div className="flex flex-row justify-between gap-2 border-b border-white/10 bg-zinc-800/50 rounded-t-xl">
              <div className="flex items-center gap-4 px-6 py-4">
                <div>
                  <h2 className="font-medium text-white text-[14px]">
                    Connected Email Inboxes
                  </h2>
                  <p className="text-xs text-zinc-400 max-w-72">
                    Manage your connected email accounts
                  </p>
                </div>
              </div>
              <AddEmailAccountButton />
            </div>
            <ConnectedGmailAccountsSection />
          </div>
        </div>
      </div>
    </div>
  );
};
