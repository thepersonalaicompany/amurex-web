import { supabase } from "@amurex/supabase";
import React from "react";

type OnboardingFlowProps = {
  onClose: () => void;
  setHasSeenOnboarding: (seen: boolean) => void;
};

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  onClose,
  setHasSeenOnboarding,
}) => {
  const handleClose = async () => {
    try {
      // @ts-ignore
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // @ts-ignore
        const { error } = await supabase
          .from("users")
          .update({ hasSeenChatOnboarding: true })
          .eq("id", session.user.id);

        if (error) {
          console.error("Error updating hasSeenChatOnboarding:", error);
        }
      }

      // Also set in localStorage for redundancy
      localStorage.setItem("hasSeenOnboarding", "true");
      setHasSeenOnboarding(true);
      onClose();
    } catch (error) {
      console.error("Error in handleClose:", error);
      // Still close the modal even if there's an error
      setHasSeenOnboarding(true);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
      {/* Main content positioned to avoid navbar */}
      <div className="bg-black bg-opacity-90 rounded-lg border border-zinc-700 max-w-4xl w-full p-6 relative pointer-events-auto">
        <div className="absolute -top-2 -left-2 bg-zinc-700 p-2 rounded-full shadow-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">
          Welcome to Amurex!
        </h2>

        <p className="text-zinc-300 mb-6">
          To get the most out of Amurex, connect your accounts to access your
          documents and information.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
                alt="Google Docs"
                className="w-8 h-8"
              />
              <h3 className="text-xl font-medium text-white">Google Docs</h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Connect your Google account to search and reference your
              documents.
            </p>
            <a
              href="/settings?tab=personalization"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#9334E9] text-white rounded-lg hover:bg-[#7928CA] transition-colors"
            >
              Connect Google
            </a>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                alt="Notion"
                className="w-8 h-8"
              />
              <h3 className="text-xl font-medium text-white">Notion</h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Connect Notion to access and search your workspaces and pages.
            </p>
            <a
              href="/settings?tab=personalization"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#9334E9] text-white rounded-lg hover:bg-[#7928CA] transition-colors"
            >
              Connect Notion
            </a>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800 hover:border-zinc-600 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                alt="Obsidian"
                className="w-8 h-8"
              />
              <h3 className="text-xl font-medium text-white">Obsidian</h3>
            </div>
            <p className="text-zinc-400 mb-4">
              Upload your Obsidian vault to search through your notes.
            </p>
            <a
              href="/settings?tab=personalization"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-[#9334E9] text-white rounded-lg hover:bg-[#7928CA] transition-colors"
            >
              Upload Obsidian
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
OnboardingFlow.displayName = "OnboardingFlow";

export type { OnboardingFlowProps };
export { OnboardingFlow };
