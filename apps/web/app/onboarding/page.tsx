"use client";

import { OnboardingContent } from "@amurex/web/components/OnboardingContent";
import { Suspense } from "react";

const OnboardingPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
};
export default OnboardingPage;
