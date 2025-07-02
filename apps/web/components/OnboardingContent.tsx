import {
  AuthSuccess,
  OnboardingProgressBar,
  OnboardingStepOne,
  OnboardingStepTwo,
  OnboardingClient,
} from "@amurex/ui/components";

export const OnboardingContent = () => {
  return (
    <OnboardingClient>
      <div className="min-h-screen bg-black text-white flex flex-col">
        {/* Header */}
        <header className="p-4 relative">
          {/* Logo positioned absolutely on the left */}
          <div className="absolute left-4 flex items-center gap-2">
            <img
              src="/amurex.png"
              alt="Amurex logo"
              className="w-10 h-10 border-2 border-black rounded-full"
              style={{ color: "var(--color-4)" }}
            />
            <span className="text-xl font-bold">Amurex</span>
          </div>

          {/* Progress bar centered in the page */}
          <OnboardingProgressBar />
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-4">
          <OnboardingStepOne />
          <OnboardingStepTwo />
          {/* Show success message and continue button after auth is completed */}
          <AuthSuccess />
        </div>
      </div>
    </OnboardingClient>
  );
};
