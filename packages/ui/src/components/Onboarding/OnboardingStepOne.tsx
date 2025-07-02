"use client";

import { useOnboardingStore } from "@amurex/ui/store";
import { ArrowRight } from "lucide-react";

export const OnboardingStepOne = () => {
  const {
    currentStep,
    isGoogleConnected,
    isProcessingEmails,
    handleConnectGmail,
    isConnecting,
    processingProgress,
    processingStep,
    setIsGoogleConnected,
    setCurrentStep,
    activeSlide,
    setActiveSlide,
    slideProgress,
    gifKey,
  } = useOnboardingStore();
  return (
    <>
      {currentStep === 1 && (
        <div className="w-full flex flex-col md:flex-row items-start justify-between gap-12 min-h-[80vh]">
          {/* Left side content - keep this compact */}
          <div className="w-full md:w-1/3 flex flex-col items-start">
            {/* Add the disclaimer text */}
            <div className="bg-[#111111] rounded-lg p-4 mb-6 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#2D1B40] flex-shrink-0 flex items-center justify-center mt-0.5">
                <span className="text-[#9334E9] text-sm font-bold">i</span>
              </div>
              <p className="text-white text-sm">
                We never send email on your behalf. We leave drafts for you to
                edit and send. If it doesn&apos;t work out with us, we&apos;ll
                leave your inbox as we found it.
              </p>
            </div>

            <h2 className="text-2xl font-bold mb-2">Connect your Gmail</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              Connect your Gmail account to enable email categorization and
              search
            </p>

            {!isGoogleConnected ? (
              <div className="w-full">
                {!isProcessingEmails ? (
                  <button
                    onClick={handleConnectGmail}
                    disabled={isConnecting}
                    className="flex items-center gap-3 py-3 px-6 bg-white text-black rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors mb-4 w-fit justify-center"
                  >
                    {isConnecting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          x="0px"
                          y="0px"
                          width="26"
                          height="26"
                          viewBox="0 0 48 48"
                        >
                          <path
                            fill="#fbc02d"
                            d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                          ></path>
                          <path
                            fill="#e53935"
                            d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                          ></path>
                          <path
                            fill="#4caf50"
                            d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                          ></path>
                          <path
                            fill="#1565c0"
                            d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                          ></path>
                        </svg>
                        Connect Google
                      </>
                    )}
                  </button>
                ) : (
                  <div className="border border-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">
                        Connecting to Gmail
                      </h3>
                      <span className="text-sm text-gray-400">
                        {processingProgress}%
                      </span>
                    </div>

                    {/* Progress steps */}
                    <div className="space-y-4 mb-4 mt-6">
                      {/* Step 1: Authentication */}
                      <div className="flex items-center gap-3">
                        {processingStep >= 1 ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 13L9 17L19 7"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-gray-600"></div>
                        )}
                        <span
                          className={
                            processingStep >= 1 ? "text-white" : "text-gray-500"
                          }
                        >
                          Authorizing
                        </span>
                      </div>

                      {/* Step 2: Fetching emails */}
                      <div className="flex items-center gap-3">
                        {processingStep >= 2 ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 13L9 17L19 7"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        ) : processingStep === 1 ? (
                          <div className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-[#9334E9] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-gray-600"></div>
                        )}
                        <span
                          className={
                            processingStep >= 2 ? "text-white" : "text-gray-500"
                          }
                        >
                          Fetching emails
                        </span>
                      </div>

                      {/* Step 3: Processing complete */}
                      <div className="flex items-center gap-3">
                        {processingStep >= 3 ? (
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M5 13L9 17L19 7"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                        ) : processingStep === 2 ? (
                          <div className="w-6 h-6 rounded-full border border-gray-600 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-[#9334E9] border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-gray-600"></div>
                        )}
                        <span
                          className={
                            processingStep >= 3 ? "text-white" : "text-gray-500"
                          }
                        >
                          Generating labels
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-6">
                      <div
                        className="h-full bg-[#9334E9] transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>

                    {/* Continue button - only shown when processing is complete */}
                    {processingStep === 3 && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={() => {
                            setIsGoogleConnected(true);
                            setCurrentStep(2);
                          }}
                          className="px-6 py-2 rounded-lg bg-[#9334E9] border border-[#9334E9] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors flex items-center gap-2"
                        >
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Test button */}
                {/* <button
                    onClick={triggerFakeAnimation}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm mt-2"
                  >
                    Test Processing Animation
                  </button> */}
              </div>
            ) : (
              <div className="flex flex-col items-center w-full mb-8">
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
                  Gmail Connected
                </h3>
                <p className="text-gray-400 text-center">
                  Your Gmail account is already connected.
                </p>
              </div>
            )}
          </div>

          {/* Right side image slider accordion with auto-scroll and progress bar */}
          <div className="w-full md:w-3/5">
            <div className="flex">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-tl-lg transition-colors ${
                  activeSlide === 1
                    ? "bg-[#9334E9] text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
                onClick={() => setActiveSlide(1)}
              >
                Knowledge Search
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium rounded-tr-lg transition-colors ${
                  activeSlide === 0
                    ? "bg-[#9334E9] text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
                onClick={() => setActiveSlide(0)}
              >
                Email Organization
              </button>
            </div>

            <div className="relative overflow-hidden w-[650px] border border-gray-800 shadow-2xl rounded-tr-lg rounded-bl-lg rounded-br-lg">
              {/* Knowledge Search slide (now first) */}
              <div
                className={`transition-all duration-500 ${
                  activeSlide === 1
                    ? "opacity-100"
                    : "opacity-0 absolute inset-0"
                }`}
                style={{
                  transform:
                    activeSlide === 1 ? "translateX(0)" : "translateX(100%)",
                }}
              >
                <img
                  key={gifKey}
                  src={`/amurex-knowledge.gif?v=${gifKey}`}
                  alt="Amurex product demo"
                  className="w-full h-auto"
                />
                <p className="text-md text-gray-400 p-2 bg-gray-900">
                  Search and retrieve information instantly
                </p>
              </div>

              {/* Email Organization slide (now second) */}
              <div
                className={`transition-all duration-500 ${
                  activeSlide === 0
                    ? "opacity-100"
                    : "opacity-0 absolute inset-0"
                }`}
                style={{
                  transform:
                    activeSlide === 0 ? "translateX(0)" : "translateX(-100%)",
                }}
              >
                <img
                  src="/inbox.png"
                  alt="Amurex product screenshot"
                  className="w-full h-auto"
                />
                <p className="text-md text-gray-400 p-2 bg-gray-900">
                  Organize your emails with smart categories
                </p>
              </div>

              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-800">
                <div
                  className="h-full bg-[#9334E9] transition-all duration-100 ease-linear"
                  style={{ width: `${slideProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
