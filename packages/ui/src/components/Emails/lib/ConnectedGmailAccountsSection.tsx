"use client";

import { useEmailsPageStore } from "@amurex/ui/store";
import { Button } from "@amurex/ui/components";

export const ConnectedGmailAccountsSection = () => {
  const { gmailAccounts, setShowAddAccountPopup, handleGmailDisconnect } =
    useEmailsPageStore();
  return (
    <div className="p-6">
      {gmailAccounts.length === 0 ? (
        <div className="text-center py-8">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="w-12 mx-auto mb-4 opacity-50"
          />
          <p className="text-zinc-400 mb-4">No Gmail accounts connected</p>
          <p className="text-xs text-zinc-500 mb-4">
            Connect your Gmail account to enable email categorization
          </p>
          <Button
            variant="outline"
            className="text-xs font-medium bg-[#3c1671] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] border border-white/10 px-4 py-2"
            onClick={() => setShowAddAccountPopup(true)}
          >
            Connect Gmail Account
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {gmailAccounts.map((account, index) => (
            <div
              key={index}
              className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                  alt="Gmail"
                  className="w-6"
                />
                <div>
                  <div className="text-white font-medium text-sm">
                    {account.email_address}
                  </div>
                  <div className="text-xs text-zinc-400">Connected</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">
                  Gmail
                </span>
                <button
                  onClick={() => handleGmailDisconnect(account.email_address)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 hover:bg-red-400/10 rounded"
                >
                  Remove connection
                </button>
              </div>
            </div>
          ))}

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>
                {gmailAccounts.length} account
                {gmailAccounts.length !== 1 ? "s" : ""} connected
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
