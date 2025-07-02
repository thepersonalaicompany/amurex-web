"use client";

import { useEmailsPageStore } from "@amurex/ui/store";

export const AddAccountPopup = () => {
  const {
    showAddAccountPopup,
    setShowAddAccountPopup,
    handleGmailConnect,
    isConnectingGmail,
  } = useEmailsPageStore();
  return (
    <>
      {showAddAccountPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">
                Add Email Account
              </h3>
              <button
                onClick={() => setShowAddAccountPopup(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Gmail Option */}
              <button
                onClick={() => {
                  setShowAddAccountPopup(false);
                  handleGmailConnect();
                }}
                disabled={isConnectingGmail}
                className="w-full p-4 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors flex items-center gap-4 bg-zinc-900/50 hover:bg-zinc-800/50"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                  alt="Gmail"
                  className="w-8"
                />
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">Gmail</div>
                  <div className="text-xs text-zinc-400">
                    Connect your Google email account
                  </div>
                </div>
                {isConnectingGmail ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-400"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                )}
              </button>

              {/* Outlook Option */}
              <div className="w-full p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 opacity-60 cursor-not-allowed flex items-center gap-4">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
                  alt="Outlook"
                  className="w-8 h-8"
                />
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">Outlook</div>
                  <div className="text-xs text-zinc-400">
                    Microsoft email account
                  </div>
                </div>
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                  Coming Soon!
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-500">
                We securely connect to your email provider to enable
                categorization
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
