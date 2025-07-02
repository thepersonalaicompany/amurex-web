"use client";

import { useSearchStore } from "@amurex/ui/store";

export const SearchPageShowGmailModal = () => {
  const { showGmailModal, googleTokenVersion, setShowGmailModal } =
    useSearchStore();
  return (
    <>
      {showGmailModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-700">
            <h3 className="text-xl font-medium text-white mb-4">
              Google Access Required
            </h3>
            <p className="text-zinc-300 mb-6">
              {googleTokenVersion === "old"
                ? "Your Google access token is old and you'll have to reconnect Google to continue using it."
                : "You need to connect your Google account to access Gmail. Please visit the settings page to connect."}
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowGmailModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <a
                href="/settings?tab=personalization"
                className="px-4 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#7928CA] transition-colors"
              >
                Go to Settings
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
