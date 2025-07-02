"use client";

import { useSearchStore } from "@amurex/ui/store";

export const SearchPageBroaderAccessModal = () => {
  const {
    showBroaderAccessModal,
    setShowBroaderAccessModal,
    isGoogleAuthInProgress,
    initiateGoogleAuth,
  } = useSearchStore();
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
              Docs search. Our app is still in the verification process with
              Google. If you wish to proceed with full access, please click the
              button below.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowBroaderAccessModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                disabled={isGoogleAuthInProgress}
              >
                Cancel
              </button>
              <button
                onClick={initiateGoogleAuth}
                className="px-4 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#7928CA] transition-colors flex items-center justify-center"
                disabled={isGoogleAuthInProgress}
              >
                {isGoogleAuthInProgress ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  "Connect Google"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
