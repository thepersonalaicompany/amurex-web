"use client";

import { useTranscriptDetailStore } from "@amurex/ui/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const MeetPreviewModalComponent = ({
  params,
}: {
  params: { id: string };
}) => {
  const router = useRouter();
  const {
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    previewContent,
    isLoadingPreview,
    handleActualDownload,
  } = useTranscriptDetailStore();
  useEffect(() => {
    // Dynamically import ldrs only on the client side
    import("ldrs").then(({ ring }) => {
      ring.register();
    });
  }, []);
  return (
    <>
      {isPreviewModalOpen && (
        <div
          className="px-2 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPreviewModalOpen(false);
            }
          }}
        >
          <div className="bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20 w-[90%] max-w-4xl max-h-[80vh] flex flex-col">
            <h2 className="lg:text-xl text-md font-medium mb-4 text-white">
              Full transcript
            </h2>

            <div className="flex-grow overflow-auto bg-[#27272A] rounded-lg p-4 mb-4">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <l-ring
                    size="40"
                    stroke="5"
                    bg-opacity="0"
                    speed="2"
                    color="white"
                  ></l-ring>
                </div>
              ) : (
                <div className="relative">
                  <div
                    className="absolute top-1 right-1 p-1.5 rounded bg-[#18181B] border border-[#303032] cursor-pointer hover:bg-[#27272A] transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(previewContent);
                      const copyButton = document.getElementById("copyIcon");
                      const checkIcon = document.getElementById("checkIcon");
                      if (copyButton && checkIcon) {
                        copyButton.style.display = "none";
                        checkIcon.style.display = "block";
                        setTimeout(() => {
                          copyButton.style.display = "block";
                          checkIcon.style.display = "none";
                        }, 1500);
                      }
                    }}
                  >
                    <svg
                      id="copyIcon"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 4V7H19"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    <img
                      id="checkIcon"
                      src="/check.png"
                      alt="Copy"
                      className="w-4 h-4"
                      style={{ display: "none" }}
                    />
                  </div>
                  <pre className="text-white whitespace-pre-wrap font-mono text-sm">
                    {previewContent}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                className="mr-2 mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-normal border border-white/10 bg-transparent text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                <span>Cancel</span>
              </button>
              <button
                className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-normal border border-white/10 bg-[#6D28D9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                onClick={() => handleActualDownload(params, router)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15V16C21 18.2091 19.2091 20 17 20H7C4.79086 20 3 18.2091 3 16V15M12 3V16M12 16L16 11M12 16L8 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
