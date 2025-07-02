"use client";

import {
  MobileWarningBanner,
  SearchPagePopup,
  SearchPanel,
  SpotlightSearch,
  StarButton,
  SearchPageGoogleDocsModal,
  SearchPageBroaderAccessModal,
  SearchPageShowGmailModal,
} from "@amurex/ui/components";
import { useSearchStore } from "@amurex/ui/store";

export const AISearchClient = () => {
  const { isSearchInitiated, handleNewSearch } = useSearchStore();
  return (
    <>
      <MobileWarningBanner />
      <div className={`min-h-screen bg-black ${isSearchInitiated ? "" : ""}`}>
        <SpotlightSearch />

        <div className="flex items-center justify-center gap-2">
          <button
            className={`fixed top-4 z-50 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 bg-zinc-900 text-white transition-all duration-200 hover:border-[#6D28D9]`}
            onClick={handleNewSearch}
          >
            <img
              src="/plus.png"
              alt="New session"
              className="w-2 h-2 inline-block"
            />
            <span>New search</span>
            <div className="ml-2 px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-400">
              ⌘K
            </div>
          </button>
        </div>

        <SearchPagePopup />

        <div className="fixed top-4 right-4 z-50 hidden">
          <StarButton />
        </div>

        {/* Onboarding modal disabled as requested
        {showOnboarding && (
          <OnboardingFlow
            onClose={() => setShowOnboarding(false)}
            setHasSeenOnboarding={setHasSeenOnboarding}
          />
        )}
        */}

        <SearchPanel />
        <SearchPageGoogleDocsModal />
        <SearchPageBroaderAccessModal />
        <SearchPageShowGmailModal />
      </div>
    </>
  );
};
