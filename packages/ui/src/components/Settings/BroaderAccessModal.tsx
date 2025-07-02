"use client";

import { useSettingsStore } from "@amurex/ui/store";

export const BroaderAccessModal = () => {
  const { showBroaderAccessModal, setShowBroaderAccessModal } =
    useSettingsStore();
  return (
    <>
      {showBroaderAccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-700">
            <h3 className="text-xl font-medium text-white mb-4">
              Broader Google Access Required
            </h3>
            <p className="text-zinc-300 mb-6">
              We need broader access to your Google account to enable Google
              Docs integration. The app is still in the verification process
              from Google.
            </p>
            <p className="text-zinc-300 mb-6">
              If you wish to proceed, you can continue with the authentication
              process.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowBroaderAccessModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBroaderAccessModal(false);
                  window.location.href = "/api/google/auth";
                }}
                className="px-4 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#7928CA] transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
