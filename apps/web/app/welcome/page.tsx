"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Step = {
  title: string;
  description: string;
  video?: string;
  component?: ReactNode;
};

const steps: Step[] = [
  {
    title: "Pin the Amurex extension",
    description: "Click the extensions menu and pin Amurex for easy access",
    video: "/Onboarding.mp4",
  },
  {
    title: "Start your first meeting",
    description: "Click on Google Meet button to start recording your meeting",
    component: (
      <div className="flex flex-col space-y-6">
        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3 min-h-[15vh]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 10L19.553 7.724C19.7054 7.64734 19.8748 7.60897 20.0466 7.61231C20.2184 7.61566 20.386 7.66061 20.5352 7.74358C20.6844 7.82655 20.8107 7.94521 20.9047 8.08963C20.9988 8.23405 21.0578 8.39997 21.077 8.573L22 15.753V16C22 16.7956 21.6839 17.5587 21.1213 18.1213C20.5587 18.6839 19.7956 19 19 19H5C4.20435 19 3.44129 18.6839 2.87868 18.1213C2.31607 17.5587 2 16.7956 2 16V8C2 7.20435 2.31607 6.44129 2.87868 5.87868C3.44129 5.31607 4.20435 5 5 5H15V10Z"
                  stroke="#A855F7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-zinc-400 text-m">Real-time suggestions</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="#A855F7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-zinc-400 text-m">Late meeting recaps</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 9L11 12L8 15M13 15H16M5 20H19C19.5304 20 20.0391 19.7893 20.4142 19.4142C20.7893 19.0391 21 18.5304 21 18V6C21 5.46957 20.7893 4.96086 20.4142 4.58579C20.0391 4.21071 19.5304 4 19 4H5C4.46957 4 3.96086 4.21071 3.58579 4.58579C3.21071 4.96086 3 5.46957 3 6V18C3 18.5304 3.21071 19.0391 3.58579 19.4142C3.96086 19.7893 4.46957 20 5 20Z"
                  stroke="#A855F7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-zinc-400 text-m">Completely open source</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12H15M9 16H15M17 21H7C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H14L19 8V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21Z"
                  stroke="#A855F7"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-zinc-400 text-m">Accurate summaries</span>
          </div>
        </div>

        {/* Google Meet Button */}
        <a
          className="w-full bg-white text-[#0E0F0F] p-2.5 md:p-3 pt-4 mt-4 text-sm md:text-base font-semibold rounded-lg hover:bg-zinc-300 hover:text-[#0E0F0F] border border-[#0E0F0F] transition-all duration-200 text-center flex items-center justify-center gap-2 cursor-pointer"
          onClick={() => {
            // track('welcome_meeting_created');
            const link = document.createElement("a");
            link.target = "_blank";
            link.href = "https://meet.new";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 87.5 72"
          >
            <path
              fill="#0066da"
              d="M0 51.5V66c0 3.315 2.685 6 6 6h14.5l3-10.96-3-9.54-9.95-3z"
            />
            <path fill="#e94235" d="M20.5 0L0 20.5l10.55 3 9.95-3 2.95-9.41z" />
            <path fill="#2684fc" d="M20.5 20.5H0v31h20.5z" />
            <path
              fill="#00ac47"
              d="M82.6 8.68L69.5 19.42v33.66l13.16 10.79c1.97 1.54 4.85.135 4.85-2.37V11c0-2.535-2.945-3.925-4.91-2.32zM49.5 36v15.5h-29V72h43c3.315 0 6-2.685 6-6V53.08z"
            />
            <path
              fill="#ffba00"
              d="M63.5 0h-43v20.5h29V36l20-16.57V6c0-3.315-2.685-6-6-6z"
            />
          </svg>
          Start a Google Meet
        </a>
      </div>
    ),
  },
];

export default function Welcome() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  if (!step) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 md:p-0"
      style={{
        backgroundImage: "url(/sign-background.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-[40rem]">
        <div className="flex justify-center items-center mb-6 md:mb-8">
          <img
            src="/amurex.png"
            alt="Amurex logo"
            className="w-8 h-8 md:w-10 md:h-10 border-2 border-white rounded-full"
          />
          <p className="text-white text-base md:text-lg font-semibold pl-2">
            Amurex
          </p>
        </div>

        <div className="w-full rounded-lg bg-[#0E0F0F] p-6 md:p-8 shadow-lg">
          {/* Main Content */}
          <div className="pt-4 pb-12 px-4">
            <div className="max-w-4xl mx-auto">
              {/* Title */}
              <div className="text-center mb-6 md:mb-8">
                <h1
                  className="font-serif text-3xl md:text-4xl mb-2 text-white"
                  style={{ fontFamily: "var(--font-noto-serif)" }}
                >
                  Final Steps
                </h1>
              </div>

              {/* Progress Bar */}
              <div className="flex gap-2 mb-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? "bg-purple-500" : "bg-white/10"
                    }`}
                  />
                ))}
              </div>

              {/* Step Content */}
              <div className="flex flex-col items-center justify-center min-h-[100px] text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">
                  {step.title}
                </h2>
                <p className="text-zinc-400 text-lg">{step.description}</p>
              </div>

              {/* Image Container */}
              <div className="relative aspect-[16/9] mb-8">
                {step.component ? (
                  step.component
                ) : (
                  <div className="absolute inset-0 rounded-lg overflow-hidden border border-white/10">
                    <video
                      src={step.video}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentStep === 0
                      ? "text-zinc-600 cursor-not-allowed"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                {currentStep < steps.length - 1 && (
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
