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
  const [emailAddress, setEmailAddress] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [googleClientId, setGoogleClientId] = useState(null);
  const [googleClientSecret, setGoogleClientSecret] = useState(null);
  const [gmailAccounts, setGmailAccounts] = useState([]);
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

  // Add popup state
  const [showAddAccountPopup, setShowAddAccountPopup] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);

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
        fetchGmailCredentials(session.user.id);
      }
    };

    fetchUserId();
  }, []);

  // Check for OAuth success and show toast
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connection = urlParams.get('connection');
    const source = urlParams.get('source');
    
    if (connection === 'success' && source === 'google') {
      toast.success('Gmail account connected successfully!');
      // Clean up the URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Refetch Gmail accounts to update the UI
      if (userId) {
        fetchGmailCredentials(userId);
      }
    }
  }, [userId]);

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

  const fetchGmailCredentials = async (uid) => {
    try {
      console.log('Fetching Gmail credentials for user:', uid);
      
      // Check the current session and token
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', {
        user_id: session?.user?.id,
        access_token: session?.access_token ? 'EXISTS' : 'MISSING',
        token_type: session?.token_type,
        expires_at: session?.expires_at
      });
      
      const { data: gmailData, error } = await supabase
        .from("user_gmails")
        .select(`
          email_address,
          refresh_token,
          google_cohort,
          google_clients (
            client_id,
            client_secret
          )
        `)
        .eq("user_id", uid);

      console.log('Gmail query result:', { gmailData, error });

      if (error) throw error;
      
      if (gmailData && gmailData.length > 0) {
        console.log('Found Gmail accounts:', gmailData);
        setGmailAccounts(gmailData);
        // Set the first account as default for backward compatibility
        const firstAccount = gmailData[0];
        setEmailAddress(firstAccount.email_address);
        setRefreshToken(firstAccount.refresh_token);
        setGoogleClientId(firstAccount.google_clients?.client_id);
        setGoogleClientSecret(firstAccount.google_clients?.client_secret);
      } else {
        console.log('No Gmail data found or empty array');
      }
    } catch (error) {
      console.error("Error fetching Gmail credentials:", error);
      // Don't show error toast as this might be expected for users without Gmail setup
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
    console.log('processGmailLabels function called!');
    console.log('gmailAccounts:', gmailAccounts);
    console.log('emailTaggingEnabled:', emailTaggingEnabled);
    console.log('isProcessingEmails:', isProcessingEmails);
    
    try {
      setIsProcessingEmails(true);
      
      if (gmailAccounts.length === 0) {
        console.log('No Gmail accounts found - returning early');
        toast.error("No Gmail accounts connected. Please go to Settings to connect your Google account first.");
        return;
      }

      let totalProcessed = 0;
      console.log(gmailAccounts);
      console.log('processing emails');

      // Process each Gmail account
      for (const account of gmailAccounts) {
        const response = await fetch('/api/gmail/process-labels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            emailAddress: account.email_address,
            useStandardColors: true,
            maxEmails: 20,
            googleClientId: account.google_clients?.client_id,
            googleClientSecret: account.google_clients?.client_secret,
            refreshToken: account.refresh_token
          }),
        });

        const data = await response.json();
        if (data.success) {
          totalProcessed += data.processed || 0;
        } else {
          console.error(`Error processing account ${account.email_address}:`, data.error);
          toast.error(`Failed to process ${account.email_address}`);
        }
      }

      toast.success(`Successfully processed ${totalProcessed} emails across ${gmailAccounts.length} accounts`);
    } catch (error) {
      console.error("Error processing Gmail labels:", error);
      toast.error("Failed to process emails");
    } finally {
      setIsProcessingEmails(false);
    }
  };

  const handleGmailConnect = async () => {
    try {
      setIsConnectingGmail(true);
      
      const response = await fetch('/api/google/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          source: 'emails', // This will help redirect back to emails page
          upgradeToFull: false // Gmail only access
        }),
      });

      const data = await response.json();
      
      if (data.success && data.url) {
        // Store that we're coming from emails page
        sessionStorage.setItem('oauth_return_path', '/emails');
        // Redirect to Google OAuth
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to initiate Gmail connection');
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      toast.error('Failed to connect Gmail. Please try again.');
      setIsConnectingGmail(false);
    }
  };

  const handleGmailDisconnect = async (emailAddress) => {
    try {
      // Remove from user_gmails table
      const { error: gmailError } = await supabase
        .from('user_gmails')
        .delete()
        .eq('user_id', userId)
        .eq('email_address', emailAddress);

      if (gmailError) throw gmailError;

      // Update local state
      setGmailAccounts(prev => prev.filter(acc => acc.email_address !== emailAddress));
      
      toast.success(`${emailAddress} disconnected successfully`);
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      toast.error('Failed to disconnect Gmail account');
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
    <div className="min-h-screen bg-black">
      <MobileWarningBanner />
      
      {/* Header Section */}
      <div className="p-8 pb-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-medium text-white">Emails</h2>
        </div>
        <p className="text-sm text-zinc-400 mb-6">
          Automated email categorization to keep your inbox
          focused on important messages
        </p>

        {/* Fake search bar */}
        <a href="/search" rel="noopener noreferrer">
          <div 
            className="hidden my-2 bg-zinc-800/80 rounded-xl flex items-center px-3 py-2 cursor-text hover:bg-zinc-700 transition-colors border border-white/10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 mr-2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <div className="text-zinc-400 text-md">Search in emails...</div>
          </div>
        </a>
      </div>

      {/* Main Content Area */}
      <div className="content p-8 pt-0 flex gap-6">
        {/* Left Column - Categorize emails with AI */}
        <div className="w-[50%]">
          <div className="rounded-xl border text-card-foreground shadow bg-black/80 border-white/10">
            <div className="flex flex-col">
              <div className="flex flex-row justify-between gap-2 border-b border-white/10 bg-zinc-800/50 rounded-t-xl">
                <div className="flex items-center gap-4 px-6 py-4">
                  <img
                    src={PROVIDER_ICONS.gmail}
                    alt="Gmail"
                    className="hidden w-8"
                  />
                  <div>
                    <h2 className="font-medium text-white text-[14px]">Categorize emails with AI</h2>
                    <p className="text-xs text-zinc-400 max-w-72">Your inbox will be organized into categories</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="hidden text-white text-sm">Enable email tagging</span>
                      <IconToggle 
                        checked={emailTaggingEnabled}
                        onChange={handleEmailTaggingToggle}
                      />
                    </div>
                  </div>
                </div>
                {emailTaggingEnabled && (
                  <div className="hidden flex items-center gap-2 mx-6">
                    <Button
                      variant="outline"
                      className="text-xs font-medium bg-[#3c1671] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] border border-white/10 px-4 py-2"
                      onClick={processGmailLabels}
                      disabled={isProcessingEmails}
                    >
                      {isProcessingEmails ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                          </svg>
                          Categorize new emails
                        </div>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="text-xs font-normal bg-[#3c1671] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] border border-white/10 px-4 py-2"
                      onClick={() => window.open("https://mail.google.com", "_blank")}
                    >
                      <div className="flex items-center">
                        <img
                          src={PROVIDER_ICONS.gmail}
                          alt="Gmail"
                          className="w-3 mr-2"
                        />
                        Open Gmail
                      </div>
                    </Button>
                  </div>
                )}
              </div>
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
                            className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.categories.to_respond ? '' : 'hover:border-[#6D28D9]'}`}
                            style={{ 
                              backgroundColor: categories.categories.to_respond ? '#F87171' : '',
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
                            className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.categories.fyi ? '' : 'hover:border-[#6D28D9]'}`}
                            style={{ 
                              backgroundColor: categories.categories.fyi ? '#F59E0B' : '',
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
                            className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.categories.comment ? '' : 'hover:border-[#6D28D9]'}`}
                            style={{ 
                              backgroundColor: categories.categories.comment ? '#F59E0B' : '',
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
                            className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.categories.notification ? '' : 'hover:border-[#6D28D9]'}`}
                            style={{ 
                              backgroundColor: categories.categories.notification ? '#34D399' : '',
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
                            className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.categories.meeting_update ? '' : 'hover:border-[#6D28D9]'}`}
                            style={{ 
                              backgroundColor: categories.categories.meeting_update ? '#60A5FA' : '',
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
                            className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.categories.awaiting_reply ? '' : 'hover:border-[#6D28D9]'}`}
                            style={{ 
                              backgroundColor: categories.categories.awaiting_reply ? '#8B5CF6' : '',
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
                            className={`h-7 w-7 flex items-center justify-center cursor-pointer rounded-lg border border-white/10 bg-zinc-900 ${categories.categories.actioned ? '' : 'hover:border-[#6D28D9]'}`}
                            style={{ 
                              backgroundColor: categories.categories.actioned ? '#8B5CF6' : '',
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
                                Click &quot;Categorize new emails&quot; above to get started, or go to Settings to connect more Gmail accounts
                              </p>
                            </div>
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

        {/* Right Column - Connected Gmail Accounts */}
        <div className="w-[50%]">
          <div className="w-full rounded-xl border text-card-foreground shadow bg-black/80 border-white/10 mb-6">
            <div className="flex flex-col">
              <div className="flex flex-row justify-between gap-2 border-b border-white/10 bg-zinc-800/50 rounded-t-xl">
                <div className="flex items-center gap-4 px-6 py-4">
                  <div>
                    <h2 className="font-medium text-white text-[14px]">Connected Email Inboxes</h2>
                    <p className="text-xs text-zinc-400 max-w-72">Manage your connected email accounts</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mx-6">
                  <Button
                    variant="outline"
                    className="text-xs font-medium bg-[#3c1671] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] border border-white/10 px-4 py-2"
                    onClick={() => setShowAddAccountPopup(true)}
                  >
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      <span className="ml-2">Add Account</span>
                    </div>
                  </Button>
                </div>
              </div>
              
              <div className="p-6">
                {gmailAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                      alt="Gmail"
                      className="w-12 mx-auto mb-4 opacity-50"
                    />
                    <p className="text-zinc-400 mb-4">No Gmail accounts connected</p>
                    <p className="text-xs text-zinc-500 mb-4">Connect your Gmail account to enable email categorization</p>
                    <Button
                      variant="outline"
                      className="text-xs font-medium bg-[#3c1671] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] border border-white/10 px-4 py-2"
                      onClick={() => setShowAddAccountPopup(true)}
                    >
                      Connect Gmail Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gmailAccounts.map((account, index) => (
                      <div
                        key={index}
                        className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                            alt="Gmail"
                            className="w-6"
                          />
                          <div>
                            <div className="text-white font-medium text-sm">{account.email_address}</div>
                            <div className="text-xs text-zinc-400">
                              Connected
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="hidden px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">
                            Gmail
                          </span>
                          <button
                            onClick={() => handleGmailDisconnect(account.email_address)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 hover:bg-red-400/10 rounded"
                          >
                            Remove connection
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Summary stats */}
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                      <div className="flex items-center justify-between text-xs text-zinc-400">
                        <span>{gmailAccounts.length} account{gmailAccounts.length !== 1 ? 's' : ''} connected</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Account Popup */}
      {showAddAccountPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/90 border border-white/10 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Add Email Account</h3>
              <button
                onClick={() => setShowAddAccountPopup(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Gmail Option */}
              <button
                onClick={() => {
                  setShowAddAccountPopup(false);
                  handleGmailConnect();
                }}
                disabled={isConnectingGmail}
                className="w-full p-4 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors flex items-center gap-4 bg-zinc-900/50 hover:bg-zinc-800/50"
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
                  alt="Gmail"
                  className="w-8"
                />
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">Gmail</div>
                  <div className="text-xs text-zinc-400">Connect your Google email account</div>
                </div>
                {isConnectingGmail ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                )}
              </button>

              {/* Outlook Option */}
              <div className="w-full p-4 rounded-lg border border-zinc-800 bg-zinc-900/30 opacity-60 cursor-not-allowed flex items-center gap-4">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg"
                  alt="Outlook"
                  className="w-8 h-8"
                />
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">Outlook</div>
                  <div className="text-xs text-zinc-400">Microsoft email account</div>
                </div>
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-400">
                  Coming Soon!
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-zinc-500">
                We securely connect to your email provider to enable categorization
              </p>
            </div>
          </div>
        </div>
      )}
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

