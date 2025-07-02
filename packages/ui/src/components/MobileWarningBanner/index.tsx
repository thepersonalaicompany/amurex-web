"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export const MobileWarningBanner = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Check if the device is mobile
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-6 text-center">
      <div className="bg-amber-900/90 rounded-lg p-8 max-w-md w-full shadow-lg border border-amber-700">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto mb-4 text-amber-500"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <h2 className="text-xl font-bold text-white mb-4">
          Mobile Access Soon!
        </h2>
        <p className="text-white mb-6">
          Please access this application from a desktop or laptop computer for
          the best experience.
        </p>
        <p className="text-amber-300 font-medium mb-6">
          Tweet about this and tag @thepersonalaico so that our CTO works{" "}
          <b>harder</b>!
        </p>
        <button
          onClick={() => {
            const tweetText =
              "Hey @thepersonalaico, make @iloveprompts work harder so that I can use your app on mobile!👨‍💻";
            const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
            window.open(tweetUrl, "_blank");
          }}
          className="inline-block bg-white text-amber-900 font-bold py-3 px-6 rounded-lg hover:bg-amber-100 transition-colors"
        >
          Tweet About This
        </button>
      </div>
    </div>
  );
};
