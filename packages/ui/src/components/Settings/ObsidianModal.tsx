"use client";

import { useSettingsStore } from "@amurex/ui/store";
import { FileText } from "lucide-react";

export const ObsidianModal = () => {
  const {
    isObsidianModalOpen,
    setIsObsidianModalOpen,
    handleFileSelect,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    selectedFiles,
    isUploading,
    uploadProgress,
    handleObsidianUplaod,
    setSelectedFiles,
  } = useSettingsStore();
  return (
    <>
      {isObsidianModalOpen && (
        <div className="px-2 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20 max-w-lg w-full">
            <h2 className="text-xl font-medium mb-4 text-white">
              Upload Markdown Files
            </h2>

            <div className="mt-4">
              <input
                type="file"
                multiple
                accept=".md"
                onChange={handleFileSelect}
                className="hidden"
                id="markdown-upload"
              />
              <label
                htmlFor="markdown-upload"
                className="cursor-pointer flex items-center justify-center w-full p-4 border-2 border-dashed border-zinc-700 rounded-lg hover:border-[#9334E9] transition-colors"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <FileText className="w-8 h-8 text-[#9334E9] mx-auto mb-2" />
                  <p className="text-white">Click to select markdown files</p>
                  <p className="text-sm text-zinc-400">
                    or drag and drop them here
                  </p>
                </div>
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-white font-medium mb-2">
                    Selected Files:
                  </h3>
                  <ul className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="text-zinc-400 flex items-center"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isUploading && (
                <div className="mt-4">
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#9334E9] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-zinc-400 text-sm mt-2 text-center">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsObsidianModalOpen(false);
                    setSelectedFiles([]);
                  }}
                  className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleObsidianUplaod}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:!bg-[#3c1671] hover:border-[#6D28D9]"
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
