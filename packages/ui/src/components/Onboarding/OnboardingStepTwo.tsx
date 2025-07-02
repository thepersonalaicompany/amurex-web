"use client";

import { useOnboardingStore } from "@amurex/ui/store";
import { ArrowRight, FileText } from "lucide-react";
import toast from "react-hot-toast";
import type { DragEvent } from "react";

export const OnboardingStepTwo = () => {
  const {
    currentStep,
    selectedTools,
    notionConnected,
    handleConnectNotion,
    isNotionConnecting,
    toggleTool,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    uploadProgress,
    isUploading,
    selectedFiles,
  } = useOnboardingStore();

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    handleDragOver(e as any);
  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    handleDragLeave(e as any);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    handleDrop(e as any);
  };

  return (
    <>
      {currentStep === 2 && (
        /* Knowledge sources step */
        <div className="w-full flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-[#2D1B40] flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#9334E9]" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4 text-center">
            Connect your knowledge sources
          </h1>
          <p className="text-gray-400 text-center mb-12">
            Connect your existing knowledge sources to get more personalized
            responses
          </p>

          {/* Tools selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
            {/* Notion */}
            <div
              className={`p-4 rounded-lg border flex flex-col justify-between h-full ${
                selectedTools.includes("notion")
                  ? "border-green-500/30"
                  : "border-gray-700 bg-black"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2D1B40] flex items-center justify-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                    alt="Notion"
                    className="w-6 h-6"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">Notion</h3>
                  <p className="text-sm text-gray-400">
                    {notionConnected
                      ? "Connected to your Notion workspace"
                      : "Connect your Notion workspace"}
                  </p>
                </div>
              </div>
              <button
                onClick={
                  notionConnected
                    ? () => toast.success("Notion is already connected!")
                    : handleConnectNotion
                }
                disabled={isNotionConnecting}
                className={`px-3 py-1.5 rounded-md transition-colors text-sm mt-4 ${
                  notionConnected
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "text-white border border-[#9334E9] bg-[#9334E9] hover:bg-[#3c1671] hover:border-[#6D28D9]"
                }`}
              >
                {isNotionConnecting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : notionConnected ? (
                  "Connected"
                ) : (
                  "Connect"
                )}
              </button>
            </div>

            {/* Obsidian */}
            <div
              className={`p-4 rounded-lg border flex flex-col justify-between h-full ${
                selectedTools.includes("obsidian")
                  ? "border-green-500/30"
                  : "border-gray-700 bg-black"
              }`}
              onClick={() => toggleTool("obsidian")}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2D1B40] flex items-center justify-center">
                  <img
                    src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                    alt="Obsidian"
                    className="w-6 h-6"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">Obsidian</h3>
                  <p className="text-sm text-gray-400">
                    Upload your Markdown files
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTool("obsidian");
                }}
                className="mt-4 px-3 py-1.5 bg-[#9334E9] border border-[#9334E9] hover:bg-[#3c1671] hover:border-[#6D28D9] text-white rounded-md transition-colors text-sm"
              >
                {selectedTools.includes("obsidian") ? "Selected" : "Select"}
              </button>
            </div>

            {/* Google Docs */}
            <div className="p-4 rounded-lg border flex flex-col justify-between h-full border-green-500/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#2D1B40] flex items-center justify-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                    alt="Gmail"
                    className="w-6 flex-shrink-0"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-white">Google</h3>
                  <p className="text-sm text-gray-400">
                    Connected to your Google Suite
                  </p>
                </div>
              </div>
              <button className="mt-4 px-3 py-1.5 rounded-md transition-colors text-sm bg-green-600 text-white hover:bg-green-700">
                Connected
              </button>
            </div>
          </div>

          {/* Obsidian file upload area (shown only when Obsidian is selected) */}
          {selectedTools.includes("obsidian") && (
            <div className="w-full mb-8">
              <div
                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-[#9334E9] transition-colors"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".md"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center justify-center">
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 16.2091 19.2091 18 17 18H7C4.79086 18 3 16.2091 3 14C3 11.7909 4.79086 10 7 10Z"
                      stroke="#9334E9"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 12V16"
                      stroke="#9334E9"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 14L12 12L10 14"
                      stroke="#9334E9"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-gray-400">
                    Drag and drop your Markdown files here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Only .md files are supported
                  </p>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-white font-medium mb-2">
                    Selected files ({selectedFiles.length})
                  </h4>
                  <ul className="max-h-40 overflow-y-auto bg-[#111111] rounded-lg p-2">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="text-gray-300 text-sm py-1 px-2 flex justify-between items-center"
                      >
                        <span>{file.name}</span>
                        <span className="text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </li>
                    ))}
                  </ul>
                  {isUploading && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-[#9334E9] h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Uploading... {uploadProgress.toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-center w-full mt-8 gap-4">
            <button
              onClick={() => {
                // Mark onboarding as complete in localStorage if needed
                localStorage.setItem("onboardingCompleted", "true");

                // Redirect to chat page
                window.location.href = "/search";
              }}
              className="px-6 py-2 rounded-lg text-white border border-[#9334E9] bg-[#9334E9] hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors flex items-center gap-2"
            >
              Complete onboarding
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
