"use client";

import { useEmailsPageStore } from "@amurex/ui/store";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Video } from "lucide-react";
import { Card, CardContent } from "@amurex/ui/components";

export const EmailCategoriesSection = () => {
  const { emailTaggingEnabled, categories, handleCategoryToggle } =
    useEmailsPageStore();
  return (
    <AnimatePresence>
      {emailTaggingEnabled ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Categories Section */}
          <motion.div
            className="overflow-hidden text-card-foreground shadow bg-black border-zinc-800 rounded-2xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {/* Header */}
            <div className="hidden flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-white">Label names</h2>
              {/* <h2 className="text-white">Categories</h2> */}
            </div>

            {/* Category Items */}
            <div className="divide-y divide-white/10">
              {/* To respond */}
              <motion.div
                className="px-6 py-2 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div
                  className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.to_respond ? "" : "hover:border-[#6D28D9]"}`}
                  style={{
                    backgroundColor: categories.to_respond ? "#F87171" : "",
                  }}
                  onClick={() =>
                    handleCategoryToggle("to_respond", !categories.to_respond)
                  }
                >
                  {categories.to_respond && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-black"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#F87171] text-black px-3 py-1 rounded text-sm font-medium">
                    To respond
                  </span>
                  <span className="text-gray-400 text-sm">
                    Awaiting your response
                  </span>
                </div>
              </motion.div>

              {/* FYI */}
              <motion.div
                className="px-6 py-2 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div
                  className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.fyi ? "" : "hover:border-[#6D28D9]"}`}
                  style={{
                    backgroundColor: categories.fyi ? "#F59E0B" : "",
                  }}
                  onClick={() => handleCategoryToggle("fyi", !categories.fyi)}
                >
                  {categories.fyi && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-black"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#F59E0B] text-black px-3 py-1 rounded text-sm font-medium">
                    FYI
                  </span>
                  <span className="text-gray-400 text-sm">
                    Information you might need to know
                  </span>
                </div>
              </motion.div>

              {/* Comment */}
              <motion.div
                className="px-6 py-2 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <div
                  className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.comment ? "" : "hover:border-[#6D28D9]"}`}
                  style={{
                    backgroundColor: categories.comment ? "#F59E0B" : "",
                  }}
                  onClick={() =>
                    handleCategoryToggle("comment", !categories.comment)
                  }
                >
                  {categories.comment && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-black"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#F59E0B] text-black px-3 py-1 rounded text-sm font-medium">
                    Comment
                  </span>
                  <span className="text-gray-400 text-sm">
                    Team comments (Google Docs, Microsoft Office, etc.)
                  </span>
                </div>
              </motion.div>

              {/* Notification */}
              <motion.div
                className="px-6 py-2 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div
                  className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.notification ? "" : "hover:border-[#6D28D9]"}`}
                  style={{
                    backgroundColor: categories.notification ? "#34D399" : "",
                  }}
                  onClick={() =>
                    handleCategoryToggle(
                      "notification",
                      !categories.notification,
                    )
                  }
                >
                  {categories.notification && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-black"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#34D399] text-black px-3 py-1 rounded text-sm font-medium">
                    Notification
                  </span>
                  <span className="text-gray-400 text-sm">
                    Automated updates from tools you use
                  </span>
                </div>
              </motion.div>

              {/* Meeting update */}
              <motion.div
                className="px-6 py-2 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <div
                  className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.meeting_update ? "" : "hover:border-[#6D28D9]"}`}
                  style={{
                    backgroundColor: categories.meeting_update ? "#60A5FA" : "",
                  }}
                  onClick={() =>
                    handleCategoryToggle(
                      "meeting_update",
                      !categories.meeting_update,
                    )
                  }
                >
                  {categories.meeting_update && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-black"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#60A5FA] text-black px-3 py-1 rounded text-sm font-medium">
                    Meeting update
                  </span>
                  <span className="text-gray-400 text-sm">
                    Calendar updates from Zoom, Google Meet, etc.
                  </span>
                </div>
              </motion.div>

              {/* Awaiting reply */}
              <motion.div
                className="px-6 py-2 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <div
                  className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.awaiting_reply ? "" : "hover:border-[#6D28D9]"}`}
                  style={{
                    backgroundColor: categories.awaiting_reply ? "#8B5CF6" : "",
                  }}
                  onClick={() =>
                    handleCategoryToggle(
                      "awaiting_reply",
                      !categories.awaiting_reply,
                    )
                  }
                >
                  {categories.awaiting_reply && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded text-sm font-medium">
                    Awaiting reply
                  </span>
                  <span className="text-gray-400 text-sm">
                    Sent emails awaiting a reply
                  </span>
                </div>
              </motion.div>

              {/* Actioned */}
              <motion.div
                className="px-6 py-2 flex items-center justify-between"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <div
                  className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.actioned ? "" : "hover:border-[#6D28D9]"}`}
                  style={{
                    backgroundColor: categories.actioned ? "#8B5CF6" : "",
                  }}
                  onClick={() =>
                    handleCategoryToggle("actioned", !categories.actioned)
                  }
                >
                  {categories.actioned && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded text-sm font-medium">
                    Actioned
                  </span>
                  <span className="text-gray-400 text-sm">
                    Sent emails not awaiting a reply
                  </span>
                </div>
              </motion.div>

              {/* Add custom category button */}
              <motion.div
                className="px-6 py-2 flex justify-center hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                  Add custom category
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#6D28D9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
            <Card className="bg-black border-white/10 relative overflow-hidden w-full">
              <div className="absolute inset-0 bg-[#3c1671]/20 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#3c1671]/30 via-[#6D28D9]/20 to-[#9334E9]/30"></div>
              <CardContent className="p-4 relative text-center">
                <div className="flex items-center gap-4 justify-center">
                  <Video className="w-6 h-6 text-[#9334E9] hidden" />
                  <div>
                    <h3 className="font-medium text-white text-lg">
                      Ready to categorize your emails!
                    </h3>
                    <p className="text-sm text-zinc-400">
                      Click &quot;Categorize new emails&quot; above to get
                      started, or go to Settings to connect more Gmail accounts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
