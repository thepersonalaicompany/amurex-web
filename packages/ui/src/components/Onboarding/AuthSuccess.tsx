"use client";

import { useOnboardingStore } from "@amurex/ui/store";
import { ArrowRight } from "lucide-react";

export const AuthSuccess = () => {
  const { authCompleted, isProcessingEmails, emailStats, setCurrentStep } =
    useOnboardingStore();
  return (
    <>
      {authCompleted && !isProcessingEmails && (
        <div className="w-full flex flex-col items-center mt-8 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <div className="w-16 h-16 bg-[#2D1B40] rounded-full flex items-center justify-center mb-4">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 13L9 17L19 7"
                stroke="#9334E9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-white mb-2">
            Gmail Connected Successfully
          </h3>
          <p className="text-gray-400 text-center mb-6">
            We&apos;ve processed {emailStats.processed} emails and stored{" "}
            {emailStats.stored} for quick access.
          </p>
          <button
            onClick={() => setCurrentStep(2)}
            className="px-6 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#8429D0] transition-colors flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
