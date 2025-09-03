"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MobileWarningBanner() {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the device is mobile
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
      <div className="w-full max-w-md rounded-lg border border-amber-700 bg-amber-900/90 p-8 shadow-lg">
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
        <h2 className="mb-4 text-xl font-bold text-white">
          Mobile Access Soon!
        </h2>
        <p className="mb-6 text-white">
          Please access this application from a desktop or laptop computer for
          the best experience.
        </p>
        <p className="mb-6 font-medium text-amber-300">
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
          className="inline-block rounded-lg bg-white px-6 py-3 font-bold text-amber-900 transition-colors hover:bg-amber-100"
        >
          Tweet About This
        </button>
      </div>
    </div>
  );
}
