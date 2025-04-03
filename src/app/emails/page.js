"use client";

import { Suspense, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Navbar } from "@/components/Navbar";
import { Plus } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
// import { Card, CardContent } from "@/components/ui/card";
// import { Video } from "lucide-react";
import { Button } from "@/components/ui/Button";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PROVIDER_ICONS = {
  gmail: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
};


function EmailsContent() {
  const [userId, setUserId] = useState(null);
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);
  const [emailTaggingEnabled, setEmailTaggingEnabled] = useState(false);
  const [categories, setCategories] = useState({
    categories: {
      to_respond: true,
      fyi: true,
      comment: true,
      notification: true,
      meeting_update: true,
      awaiting_reply: true,
      actioned: true
    },
    custom_properties: {}
  });

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchCategories(session.user.id);
        fetchEmailTaggingStatus(session.user.id);
      }
    };

    fetchUserId();
  }, []);

  const fetchCategories = async (uid) => {
    try {
      const response = await fetch(`/api/email-preferences?userId=${uid}`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching email categories:", error);
      toast.error("Failed to load email preferences");
    }
  };

  const fetchEmailTaggingStatus = async (uid) => {
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("email_tagging_enabled")
        .eq("id", uid)
        .single();

      if (error) throw error;
      setEmailTaggingEnabled(userData.email_tagging_enabled || false);
    } catch (error) {
      console.error("Error fetching email tagging status:", error);
      toast.error("Failed to load email tagging status");
    }
  };

  const handleCategoryToggle = async (category, checked) => {
    try {
      const newCategories = {
        ...categories,
        categories: {
          ...categories.categories,
          [category]: checked
        }
      };

      const response = await fetch('/api/email-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          categories: newCategories
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCategories(newCategories);
        toast.success(`${category.replace('_', ' ')} category updated`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  const processGmailLabels = async () => {
    try {
      setIsProcessingEmails(true);
      const response = await fetch('/api/gmail/process-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          useStandardColors: false
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully processed ${data.processed} emails`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error processing Gmail labels:", error);
      toast.error("Failed to process emails");
    } finally {
      setIsProcessingEmails(false);
    }
  };

  const handleGmailConnect = async () => {
    try {
      setIsProcessingEmails(true);
      const { error } = await supabase
        .from("users")
        .update({ email_tagging_enabled: true })
        .eq("id", userId);

      if (error) throw error;
      setEmailTaggingEnabled(true);
      toast.success("Gmail connected successfully");
    } catch (error) {
      console.error("Error connecting Gmail:", error);
      toast.error("Failed to connect Gmail");
    } finally {
      setIsProcessingEmails(false);
    }
  };

  const handleEmailTaggingToggle = async (checked) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ email_tagging_enabled: checked })
        .eq("id", userId);

      if (error) throw error;
      setEmailTaggingEnabled(checked);
      toast.success(checked ? "Email tagging enabled" : "Email tagging disabled");
    } catch (error) {
      console.error("Error updating email tagging status:", error);
      toast.error("Failed to update email tagging status");
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 ml-16 p-8">
        <div>
          <h2 className="text-2xl font-medium text-white">Emails</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Automatically sort and filter your emails to keep your main inbox
            focused on important messages
          </p>

          {/* Email Tagging Toggle Card */}
          {/* <div className="rounded-xl border text-card-foreground shadow bg-black border-zinc-800 p-4 mb-6"> */}
          <div className="bg-zinc-900/70 rounded-lg border border-zinc-800 relative p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={PROVIDER_ICONS.gmail}
                  alt="Gmail"
                  className="w-8"
                />
                <div>
                  <h2 className="font-medium text-white text-lg">Gmail Smart Labels</h2>
                  <p className="text-xs text-zinc-600 max-w-72">Auto-categorize emails with AI</p>
                </div>
                <Switch
                  checked={emailTaggingEnabled}
                  onCheckedChange={handleEmailTaggingToggle}
                  className={emailTaggingEnabled ? "bg-[#9334E9]" : "bg-zinc-700"}
                />
              </div>
              <div className="flex items-center gap-6">
                {emailTaggingEnabled && (
                  <Button
                    variant="outline"
                    // className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:border-[#9334E9] border border-zinc-700 min-w-[140px] px-4 py-2"
                    className="px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] font-medium border border-white/10 text-[#FAFAFA] bg-[#9334E9] hover:bg-[#3c1671] border-[#6D28D9] transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]"
                    onClick={processGmailLabels}
                    disabled={isProcessingEmails}
                  >
                    {isProcessingEmails ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9334E9] mr-2"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <div className="flex items-center">
                        <img
                          src={PROVIDER_ICONS.gmail}
                          alt="Gmail"
                          className="w-4 mr-2"
                        />
                        Process new emails
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {emailTaggingEnabled ? (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Info Card */}
                <div className="hidden bg-black rounded-lg p-4 mb-6 flex items-start gap-3">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-400 mt-1"
                  >
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 16V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 8H12.01"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-gray-400">
                    If you switch a category off here, emails in that category will be
                    filed away in their folder or label, and won&apos;t be shown in
                    your main inbox.
                  </span>
                </div>

                {/* Categories Section */}
                <motion.div 
                  // className="overflow-hidden border text-card-foreground shadow rounded-xl bg-black border-zinc-800"
                  className="bg-zinc-900/70 rounded-lg border border-zinc-800 relative"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-white">Show in inbox?</h2>
                    <h2 className="text-white">Categories</h2>
                  </div>

                  {/* Category Items */}
                  <div className="divide-y divide-zinc-800">
                    {/* To respond */}
                    <motion.div 
                      className="px-6 py-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <Switch
                        checked={categories.categories.to_respond}
                        onCheckedChange={(checked) => handleCategoryToggle('to_respond', checked)}
                        className="data-[state=checked]:bg-[#F87171] data-[state=unchecked]:bg-zinc-700"
                      />
                      <div className="flex-1 flex items-center gap-3 ml-6">
                        <span className="bg-[#F87171] text-black px-3 py-1 rounded text-sm font-medium">
                          To respond
                        </span>
                        <span className="text-gray-400">
                          Emails you need to respond to
                        </span>
                      </div>
                    </motion.div>

                    {/* FYI */}
                    <motion.div 
                      className="px-6 py-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <Switch
                        checked={categories.categories.fyi}
                        onCheckedChange={(checked) => handleCategoryToggle('fyi', checked)}
                        className="data-[state=checked]:bg-[#F59E0B] data-[state=unchecked]:bg-zinc-700"
                      />
                      <div className="flex-1 flex items-center gap-3 ml-6">
                        <span className="bg-[#F59E0B] text-black px-3 py-1 rounded text-sm font-medium">
                          FYI
                        </span>
                        <span className="text-gray-400">
                          Emails that don&apos;t require your response, but are
                          important
                        </span>
                      </div>
                    </motion.div>

                    {/* Comment */}
                    <motion.div 
                      className="px-6 py-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      <Switch
                        checked={categories.categories.comment}
                        onCheckedChange={(checked) => handleCategoryToggle('comment', checked)}
                        className="data-[state=checked]:bg-[#F59E0B] data-[state=unchecked]:bg-zinc-700"
                      />
                      <div className="flex-1 flex items-center gap-3 ml-6">
                        <span className="bg-[#F59E0B] text-black px-3 py-1 rounded text-sm font-medium">
                          Comment
                        </span>
                        <span className="text-gray-400">
                          Team chats in tools like Google Docs or Microsoft Office
                        </span>
                      </div>
                    </motion.div>

                    {/* Notification */}
                    <motion.div 
                      className="px-6 py-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      <Switch
                        checked={categories.categories.notification}
                        onCheckedChange={(checked) => handleCategoryToggle('notification', checked)}
                        className="data-[state=checked]:bg-[#34D399] data-[state=unchecked]:bg-zinc-700"
                      />
                      <div className="flex-1 flex items-center gap-3 ml-6">
                        <span className="bg-[#34D399] text-black px-3 py-1 rounded text-sm font-medium">
                          Notification
                        </span>
                        <span className="text-gray-400">
                          Automated updates from tools you use
                        </span>
                      </div>
                    </motion.div>

                    {/* Meeting update */}
                    <motion.div 
                      className="px-6 py-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <Switch
                        checked={categories.categories.meeting_update}
                        onCheckedChange={(checked) => handleCategoryToggle('meeting_update', checked)}
                        className="data-[state=checked]:bg-[#60A5FA] data-[state=unchecked]:bg-zinc-700"
                      />
                      <div className="flex-1 flex items-center gap-3 ml-6">
                        <span className="bg-[#60A5FA] text-black px-3 py-1 rounded text-sm font-medium">
                          Meeting update
                        </span>
                        <span className="text-gray-400">
                          Calendar updates from Zoom, Google Meet, etc
                        </span>
                      </div>
                    </motion.div>

                    {/* Awaiting reply */}
                    <motion.div 
                      className="px-6 py-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <Switch
                        checked={categories.categories.awaiting_reply}
                        onCheckedChange={(checked) => handleCategoryToggle('awaiting_reply', checked)}
                        className="data-[state=checked]:bg-[#8B5CF6] data-[state=unchecked]:bg-zinc-700"
                      />
                      <div className="flex-1 flex items-center gap-3 ml-6">
                        <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded text-sm font-medium">
                          Awaiting reply
                        </span>
                        <span className="text-gray-400">
                          Emails you&apos;ve sent that you&apos;re expecting a reply
                          to
                        </span>
                      </div>
                    </motion.div>

                    {/* Actioned */}
                    <motion.div 
                      className="px-6 py-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.7 }}
                    >
                      <Switch
                        checked={categories.categories.actioned}
                        onCheckedChange={(checked) => handleCategoryToggle('actioned', checked)}
                        className="data-[state=checked]:bg-[#8B5CF6] data-[state=unchecked]:bg-zinc-700"
                      />
                      <div className="flex-1 flex items-center gap-3 ml-6">
                        <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded text-sm font-medium">
                          Actioned
                        </span>
                        <span className="text-gray-400">
                          Emails you&apos;ve sent that you&apos;re not expecting a
                          reply to
                        </span>
                      </div>
                    </motion.div>

                    {/* Add custom category button */}
                    <motion.div 
                      className="px-6 py-4 flex justify-center hidden"
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
              <div></div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function EmailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailsContent />
    </Suspense>
  );
}

