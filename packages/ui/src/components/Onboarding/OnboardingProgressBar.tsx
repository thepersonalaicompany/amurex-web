"use client";

import { useOnboardingStore } from "@amurex/ui/store";

export const OnboardingProgressBar = () => {
  const { currentStep, totalSteps } = useOnboardingStore();
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="text-xs text-zinc-400 mb-1 flex justify-between w-96">
        <span>
          {currentStep === 1 ? "Connect Gmail" : "Connect knowledge sources"}
        </span>
        <span>
          {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="w-96 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#9334E9]"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
