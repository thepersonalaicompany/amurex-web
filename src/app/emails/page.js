"use client";

import { Suspense, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import MobileWarningBanner from "@/components/MobileWarningBanner";
import IconToggle from "@/components/ui/IconToggle";

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
  const [hasEmailRecord, setHasEmailRecord] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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

  // Sample emails for the preview
  const sampleEmails = [
    { id: 1, sender: "Product Team", subject: "Need your feedback on this proposal", category: "to_respond", time: "10:30 AM" },
    { id: 2, sender: "Sanskar Jethi", subject: "Boring stakeholder meeting on ROI strategy for Q3", category: "fyi", time: "Yesterday" },
    { id: 3, sender: "Arsen Kylyshbek", subject: "just launched a feature - let's f*cking go!", category: "comment", time: "Yesterday" },
    { id: 4, sender: "GitHub", subject: "Security alert for your repository", category: "notification", time: "Sep 14" },
    { id: 5, sender: "Zoom", subject: "Your meeting with Design Team has been scheduled", category: "meeting_update", time: "Sep 14" },
    { id: 6, sender: "Alice Bentinck", subject: "Re: Invitation - IC", category: "awaiting_reply", time: "Sep 13" },
    { id: 7, sender: "Marketing", subject: "Content calendar approved", category: "actioned", time: "Sep 12" }
  ];

  // Filter emails based on enabled categories
  const filteredEmails = sampleEmails.filter(email => 
    categories.categories[email.category]
  );

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchCategories(session.user.id);
        fetchEmailTaggingStatus(session.user.id);
        checkEmailRecord(session.user.id);
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

  const checkEmailRecord = async (uid) => {
    try {
      const { data, error } = await supabase
        .from("emails")
        .select("id")
        .eq("user_id", uid)
        .limit(1);

      if (error) throw error;
      setHasEmailRecord(data && data.length > 0);
    } catch (error) {
      console.error("Error checking email records:", error);
      setHasEmailRecord(false);
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

  // Function to handle email click
  const handleEmailClick = (sender) => {
    if (sender === "Sanskar Jethi") {
      window.open("https://www.linkedin.com/in/sanskar123/", "_blank");
    } else if (sender === "Arsen Kylyshbek") {
      window.open("https://www.linkedin.com/in/arsenkk/", "_blank");
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      <MobileWarningBanner />
      {/* Main Content Area */}
      <div className="flex flex-1 p-8 gap-8">
        {/* Left Column - Settings */}
        <div className={`${showPreview ? 'w-[60%]' : 'w-full'} transition-all duration-500`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-medium text-white">Emails</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-6">
            Automated email categorization to keep your inbox
            focused on important messages
          </p>

          {/* Email Tagging Toggle Card */}
          {/* Fake search bar */}
          <a href="/search" rel="noopener noreferrer">
            <div 
              className="my-2 bg-zinc-800 rounded-xl flex items-center px-3 py-2 cursor-text hover:bg-zinc-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 mr-2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <div className="text-zinc-400 text-md">Search in emails...</div>
            </div>
          </a>
          <div className="rounded-xl border text-card-foreground shadow bg-black border-zinc-800 mb-6">
            <div className="flex flex-col">
              <div className="flex flex-row justify-between gap-2 border-b border-zinc-800 bg-zinc-800/50 rounded-t-xl">
                <div className="flex items-center gap-4 px-6 py-4">
                  <img
                    src={PROVIDER_ICONS.gmail}
                    alt="Gmail"
                    className="hidden w-8"
                  />
                  <div>
                    <h2 className="font-medium text-white text-lg">AI categorization</h2>
                    {/* <p className="text-xs text-zinc-600 max-w-72">Auto-categorize emails with AI</p> */}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="hidden text-white text-sm">Enable email tagging</span>
                      <IconToggle 
                        checked={emailTaggingEnabled}
                        onChange={handleEmailTaggingToggle}
                      />
                    </div>
                    {emailTaggingEnabled && (
                      <Button
                        variant="outline"
                        className="hidden bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:border-[#9334E9] border border-zinc-700 min-w-[140px] px-4 py-2"
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
                <div 
                  className="flex items-center mx-6 gap-2 px-3 py-1 bg-zinc-700 rounded-md cursor-pointer hover:bg-zinc-900 transition-colors h-fit my-auto"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="hidden h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <img
                      src={PROVIDER_ICONS.gmail}
                      alt="Gmail"
                      className="w-6 mr-2"
                    />
                  <span className="text-white text-lg">{showPreview ? "Hide Preview" : "Show Preview"}</span>
                </div>
              </div>
              <AnimatePresence>
                {emailTaggingEnabled && hasEmailRecord ? (
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
                      className="overflow-hidden text-card-foreground shadow bg-black border-zinc-800 rounded-2xl"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      {/* Header */}
                      <div className="hidden flex items-center justify-between px-6 py-4 border-b border-zinc-800">
                        <h2 className="text-white">Label names</h2>
                        {/* <h2 className="text-white">Categories</h2> */}
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
                          <div 
                            className="h-7 w-7 flex items-center justify-center cursor-pointer rounded border border-zinc-800" 
                            style={{ 
                              backgroundColor: categories.categories.to_respond ? '#F87171' : 'transparent',
                            }}
                            onClick={() => handleCategoryToggle('to_respond', !categories.categories.to_respond)}
                          >
                            {categories.categories.to_respond && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-3 ml-6">
                            <span className="bg-[#F87171] text-black px-3 py-1 rounded text-sm font-medium">
                              To respond
                            </span>
                            <span className="text-gray-400">
                              Awaiting your response
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
                          <div 
                            className="h-7 w-7 flex items-center justify-center cursor-pointer rounded border border-zinc-800" 
                            style={{ 
                              backgroundColor: categories.categories.fyi ? '#F59E0B' : 'transparent',
                            }}
                            onClick={() => handleCategoryToggle('fyi', !categories.categories.fyi)}
                          >
                            {categories.categories.fyi && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-3 ml-6">
                            <span className="bg-[#F59E0B] text-black px-3 py-1 rounded text-sm font-medium">
                              FYI
                            </span>
                            <span className="text-gray-400">
                              Information you might need to know
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
                          <div 
                            className="h-7 w-7 flex items-center justify-center cursor-pointer rounded border border-zinc-800" 
                            style={{ 
                              backgroundColor: categories.categories.comment ? '#F59E0B' : 'transparent',
                            }}
                            onClick={() => handleCategoryToggle('comment', !categories.categories.comment)}
                          >
                            {categories.categories.comment && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-3 ml-6">
                            <span className="bg-[#F59E0B] text-black px-3 py-1 rounded text-sm font-medium">
                              Comment
                            </span>
                            <span className="text-gray-400">
                              Team comments (Google Docs, Microsoft Office, etc.)
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
                          <div 
                            className="h-7 w-7 flex items-center justify-center cursor-pointer rounded border border-zinc-800" 
                            style={{ 
                              backgroundColor: categories.categories.notification ? '#34D399' : 'transparent',
                            }}
                            onClick={() => handleCategoryToggle('notification', !categories.categories.notification)}
                          >
                            {categories.categories.notification && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
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
                          <div 
                            className="h-7 w-7 flex items-center justify-center cursor-pointer rounded border border-zinc-800" 
                            style={{ 
                              backgroundColor: categories.categories.meeting_update ? '#60A5FA' : 'transparent',
                            }}
                            onClick={() => handleCategoryToggle('meeting_update', !categories.categories.meeting_update)}
                          >
                            {categories.categories.meeting_update && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-black" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-3 ml-6">
                            <span className="bg-[#60A5FA] text-black px-3 py-1 rounded text-sm font-medium">
                              Meeting update
                            </span>
                            <span className="text-gray-400">
                              Calendar updates from Zoom, Google Meet, etc.
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
                          <div 
                            className="h-7 w-7 flex items-center justify-center cursor-pointer rounded border border-zinc-800" 
                            style={{ 
                              backgroundColor: categories.categories.awaiting_reply ? '#8B5CF6' : 'transparent',
                            }}
                            onClick={() => handleCategoryToggle('awaiting_reply', !categories.categories.awaiting_reply)}
                          >
                            {categories.categories.awaiting_reply && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-3 ml-6">
                            <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded text-sm font-medium">
                              Awaiting reply
                            </span>
                            <span className="text-gray-400">
                              Sent emails awaiting a reply
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
                          <div 
                            className="h-7 w-7 flex items-center justify-center cursor-pointer rounded border border-zinc-800"
                            style={{ 
                              backgroundColor: categories.categories.actioned ? '#8B5CF6' : 'transparent',
                            }}
                            onClick={() => handleCategoryToggle('actioned', !categories.categories.actioned)}
                          >
                            {categories.categories.actioned && (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-3 ml-6">
                            <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded text-sm font-medium">
                              Actioned
                            </span>
                            <span className="text-gray-400">
                              Sent emails not awaiting a reply
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
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9334E9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
                      <Card className="bg-black border-zinc-500 relative overflow-hidden w-full">
                        <div className="absolute inset-0 bg-[#9334E9]/20 animate-pulse"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#9334E9]/30 via-[#9334E9]/20 to-[#9334E9]/30"></div>
                        <CardContent className="p-4 relative text-center">
                          <div className="flex items-center gap-4 justify-center">
                            <Video className="w-6 h-6 text-[#9334E9] hidden" />
                            <div>
                              <h3 className="font-medium text-white text-lg">
                                Try Amurex for Smart Email Categorization
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Get automated categorization for your emails
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <a
                              href="/settings"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors duration-200"
                            >
                              Connect Google account
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          
        </div>

        {/* Right Column - Gmail Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div 
              className="w-[40%] flex flex-col"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '40%' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Invisible spacer to match the header height */}
              <div className="h-[88px]"></div>
              
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden h-fit">
                <div className="bg-zinc-800 p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <h3 className="text-white font-medium">Inbox Preview</h3>
                  </div>
                  <div 
                    className="p-1 hover:bg-zinc-700 rounded-full cursor-pointer transition-colors"
                    onClick={() => setShowPreview(false)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="divide-y divide-zinc-800">
                  {sampleEmails.map(email => {
                    return (
                      <div 
                        key={email.id} 
                        className="p-3 hover:bg-zinc-800/50 cursor-pointer"
                        onClick={() => handleEmailClick(email.sender)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-white">
                            {email.sender}
                          </div>
                          <div className="text-xs text-zinc-500">{email.time}</div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-sm text-zinc-400">{email.subject}</div>
                          
                          {/* Labels next to subject */}
                          {email.category === "to_respond" && categories.categories.to_respond && (
                            <span className="bg-[#F87171] text-black text-xs px-2 py-0.5 rounded">To respond</span>
                          )}
                          {email.category === "fyi" && categories.categories.fyi && (
                            <span className="bg-[#F59E0B] text-black text-xs px-2 py-0.5 rounded">FYI</span>
                          )}
                          {email.category === "comment" && categories.categories.comment && (
                            <span className="bg-[#F59E0B] text-black text-xs px-2 py-0.5 rounded">Comment</span>
                          )}
                          {email.category === "notification" && categories.categories.notification && (
                            <span className="bg-[#34D399] text-black text-xs px-2 py-0.5 rounded">Notification</span>
                          )}
                          {email.category === "meeting_update" && categories.categories.meeting_update && (
                            <span className="bg-[#60A5FA] text-black text-xs px-2 py-0.5 rounded">Meeting update</span>
                          )}
                          {email.category === "awaiting_reply" && categories.categories.awaiting_reply && (
                            <span className="bg-[#8B5CF6] text-white text-xs px-2 py-0.5 rounded">Awaiting reply</span>
                          )}
                          {email.category === "actioned" && categories.categories.actioned && (
                            <span className="bg-[#8B5CF6] text-white text-xs px-2 py-0.5 rounded">Actioned</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

