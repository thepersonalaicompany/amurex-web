"use client";

import { useSettingsStore } from "@amurex/ui/store";

export const SettingsWarningModal = () => {
  const { showWarningModal, setShowWarningModal, handleGoogleDocsConnect } =
    useSettingsStore();
  return (
    <>
      {showWarningModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-zinc-900 rounded-lg p-6 max-w-md w-full border border-zinc-700">
            <h3 className="text-xl font-medium text-white mb-4">
              Your data is safe
            </h3>
            <p className="text-zinc-300 mb-6">
              Since the app is still in Google&apos;s review process, you will
              be warned that the app is unsafe.
              <br />
              <br />
              You can safely proceed by clicking on &quot;Advanced&quot; and
              then &quot;Go to Amurex (unsafe)&quot;.
            </p>
            <p className="text-zinc-300 mb-6">
              We ensure that the app is safe to use and your data{" "}
              <span className="font-bold underline">
                <a
                  href="https://github.com/thepersonalaicompany/amurex-web"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  is secure
                </a>
              </span>
              .
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  handleGoogleDocsConnect();
                }}
                className="px-4 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#7928CA] transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
