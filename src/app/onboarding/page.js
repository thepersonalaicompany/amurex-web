"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, FileText, Calendar, ArrowRight, Tag, Star, Briefcase, User, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [selectedTools, setSelectedTools] = useState([]);
  const [smartCategorizationEnabled, setSmartCategorizationEnabled] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState(['important', 'work', 'personal']);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);
  const [gmailPermissionError, setGmailPermissionError] = useState(false);
  const [isImportingDocs, setIsImportingDocs] = useState(false);
  const [emailStats, setEmailStats] = useState({
    processed: 0,
    stored: 0,
    total: 0
  });
  const [showEmailStats, setShowEmailStats] = useState(false);

  // Check for connection success on component mount
  useEffect(() => {
    const connectionStatus = searchParams.get('connection');
    if (connectionStatus === 'success') {
      // Check if we were connecting Gmail or Google Docs
      if (localStorage.getItem("pendingGmailConnect") === "true") {
        localStorage.removeItem("pendingGmailConnect");
        toast.success("Gmail connected successfully!");
        
        // Enable email tagging for the user
        enableEmailTagging();
        
        setCurrentStep(2);
      } else if (localStorage.getItem("pendingGoogleDocsImport") === "true") {
        localStorage.removeItem("pendingGoogleDocsImport");
        toast.success("Google Docs connected successfully!");
        
        // Start the complete import process
        startCompleteImportProcess();
      }
    }
  }, [searchParams]);

  // Function to enable email tagging in Supabase
  const enableEmailTagging = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) {
        console.error("No session found when trying to enable email tagging");
        return;
      }
      
      const { error } = await supabase
        .from('users')
        .update({ email_tagging_enabled: true })
        .eq('id', session.user.id);
        
      if (error) {
        console.error("Error enabling email tagging:", error);
      } else {
        console.log("Email tagging enabled successfully");
      }
    } catch (error) {
      console.error("Error enabling email tagging:", error);
    }
  }, []);

  const handleConnectGmail = useCallback(async () => {
    setIsConnecting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (session) {
        const response = await fetch("/api/google/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            userId: session.user.id,
            source: 'onboarding'
          }),
        });
        
        const data = await response.json();
        
        if (data.url) {
          localStorage.setItem("pendingGmailConnect", "true");
          router.push(data.url);
        } else {
          console.error("Error starting Gmail OAuth flow:", data.error);
          toast.error("Failed to connect Gmail. Please try again.");
          setIsConnecting(false);
        }
      } else {
        toast.error("You must be logged in to connect Gmail");
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("Error connecting Gmail:", error);
      toast.error("Failed to connect Gmail. Please try again.");
      setIsConnecting(false);
    }
  }, [router]);

  const handleConnectGoogleDocs = useCallback(async () => {
    setIsImportingDocs(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (session) {
        const response = await fetch("/api/google/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            userId: session.user.id,
            source: 'onboarding'
          }),
        });
        
        const data = await response.json();
        
        if (data.url) {
          localStorage.setItem("pendingGoogleDocsImport", "true");
          router.push(data.url);
        } else {
          console.error("Error starting Google OAuth flow:", data.error);
          toast.error("Failed to connect Google Docs. Please try again.");
          setIsImportingDocs(false);
        }
      } else {
        toast.error("You must be logged in to connect Google Docs");
        setIsImportingDocs(false);
      }
    } catch (error) {
      console.error("Error connecting Google Docs:", error);
      toast.error("Failed to connect Google Docs. Please try again.");
      setIsImportingDocs(false);
    }
  }, [router]);

  // Function to handle the complete import process
  const startCompleteImportProcess = useCallback(async () => {
    setIsImportingDocs(true);
    
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in to complete the import process");
        setIsImportingDocs(false);
        return;
      }
      
      // Step 1: Import Google Docs
      toast.loading("Importing Google Docs...", { id: "import-process" });
      
      const docsResponse = await fetch("/api/google/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: session.user.id,
          accessToken: session.access_token,
        }),
      });
      
      const docsData = await docsResponse.json();
      
      if (!docsData.success) {
        toast.error(docsData.error || "Failed to import Google Docs", { id: "import-process" });
        setIsImportingDocs(false);
        return;
      }
      
      toast.success("Google Docs imported successfully!", { id: "import-process" });
      
      // Step 2 & 3: Process Gmail - this endpoint handles both fetching and labeling emails
      setIsProcessingEmails(true);
      toast.loading("Processing emails...", { id: "email-process" });
      
      const emailResponse = await fetch("/api/gmail/process-labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          categories: selectedCategories,
          useStandardColors: false
        }),
      });
      
      const emailData = await emailResponse.json();
      
      if (emailData.success) {
        // Store the email processing stats
        setEmailStats({
          processed: emailData.processed || 0,
          stored: emailData.total_stored || 0,
          total: emailData.total_found || 0
        });
        setShowEmailStats(true);
        
        toast.success(`Successfully processed ${emailData.total_stored} emails`, { id: "email-process" });
        
        // Add a slight delay before redirecting to allow the user to see the stats
        setTimeout(() => {
          router.push('/chat');
        }, 3000);
      } else {
        if (emailData.errorType === "insufficient_permissions") {
          setGmailPermissionError(true);
          toast.error("Insufficient Gmail permissions. Please reconnect your Google account.", { id: "email-process" });
        } else {
          toast.error(emailData.error || "Failed to process emails", { id: "email-process" });
        }
      }
    } catch (error) {
      console.error("Error in import process:", error);
      toast.error("Failed to complete the import process", { id: "import-process" });
    } finally {
      setIsProcessingEmails(false);
      setIsImportingDocs(false);
    }
  }, [selectedCategories, router]);

  const handleContinue = () => {
    if (currentStep === 2 && selectedTools.includes('google-docs')) {
      handleConnectGoogleDocs();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleCompleteSetup = async () => {
    if (selectedTools.includes('google-docs')) {
      handleConnectGoogleDocs();
    } else if (smartCategorizationEnabled) {
      startCompleteImportProcess();
    } else {
      router.push('/chat');
    }
  };

  const handleSkip = () => {
    router.push('/chat');
  };

  const toggleTool = (tool) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter(t => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#9334E9] flex items-center justify-center text-white font-bold">
            A
          </div>
          <span className="text-xl font-bold">Amurex</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            <span>{currentStep} of {totalSteps}</span>
          </div>
          <button 
            onClick={handleSkip}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800">
        <div 
          className="h-full bg-[#9334E9]" 
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto px-4">
        {currentStep === 1 && (
          /* Gmail connection step */
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#2D1B40] flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#9334E9]" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4 text-center">Connect your Gmail</h1>
            <p className="text-gray-400 text-center mb-12">
              Connect your Gmail account to get the most out of Amurex
            </p>

            {/* Security notice */}
            <div className="bg-[#111111] rounded-lg p-4 mb-8 w-full">
              <div className="flex gap-3">
                <div className="text-[#9334E9]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-300">
                  We never send email on your behalf. We leave drafts for you to edit and send. If it doesn't work out with us, we'll leave your inbox as we found it.
                </p>
              </div>
            </div>

            {/* Features list */}
            <div className="bg-[#111111] rounded-lg p-4 mb-8 w-full">
              <h3 className="text-lg font-medium mb-4">What you'll get:</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <div className="text-[#9334E9]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-300">Smart email categorization</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="text-[#9334E9]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-300">AI-powered reply drafts</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="text-[#9334E9]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-300">Meeting summaries and follow-ups</span>
                </li>
              </ul>
            </div>

            {/* Connect button */}
            <button
              onClick={handleConnectGmail}
              disabled={isConnecting}
              className="w-full py-3 bg-[#9334E9] hover:bg-[#7928CA] transition-colors rounded-lg flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  <span>Connect Gmail</span>
                </>
              )}
            </button>
            
            {gmailPermissionError && (
              <div className="mt-4 text-red-400 text-sm">
                Insufficient Gmail permissions. Please try connecting again.
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          /* Tools connection step */
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#2D1B40] flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#9334E9]" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4 text-center">Connect your tools</h1>
            <p className="text-gray-400 text-center mb-12">
              Connect your productivity tools to get the most out of Amurex
            </p>

            {/* Tools grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
              {/* Notion */}
              <div 
                className={`bg-[#111111] rounded-lg p-4 cursor-pointer border ${selectedTools.includes('notion') ? 'border-[#9334E9]' : 'border-transparent'}`}
                onClick={() => toggleTool('notion')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-600 text-[#9334E9] focus:ring-[#9334E9]"
                      checked={selectedTools.includes('notion')}
                      onChange={() => {}}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Notion</h3>
                    <p className="text-sm text-gray-400">
                      Connect your Notion workspace to search and manage your documents
                    </p>
                  </div>
                </div>
              </div>

              {/* Obsidian */}
              <div 
                className={`bg-[#111111] rounded-lg p-4 cursor-pointer border ${selectedTools.includes('obsidian') ? 'border-[#9334E9]' : 'border-transparent'}`}
                onClick={() => toggleTool('obsidian')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-600 text-[#9334E9] focus:ring-[#9334E9]"
                      checked={selectedTools.includes('obsidian')}
                      onChange={() => {}}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Obsidian</h3>
                    <p className="text-sm text-gray-400">
                      Connect your Obsidian vault to search and reference your notes
                    </p>
                  </div>
                </div>
              </div>

              {/* Google Docs */}
              <div 
                className={`bg-[#111111] rounded-lg p-4 cursor-pointer border ${selectedTools.includes('google-docs') ? 'border-[#9334E9]' : 'border-transparent'}`}
                onClick={() => toggleTool('google-docs')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-600 text-[#9334E9] focus:ring-[#9334E9]"
                      checked={selectedTools.includes('google-docs')}
                      onChange={() => {}}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Google Docs</h3>
                    <p className="text-sm text-gray-400">
                      Connect Google Docs to search and edit your documents
                    </p>
                  </div>
                </div>
              </div>

              {/* Meetings */}
              <div 
                className={`bg-[#111111] rounded-lg p-4 cursor-pointer border ${selectedTools.includes('meetings') ? 'border-[#9334E9]' : 'border-transparent'}`}
                onClick={() => toggleTool('meetings')}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-gray-600 text-[#9334E9] focus:ring-[#9334E9]"
                      checked={selectedTools.includes('meetings')}
                      onChange={() => {}}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Meetings</h3>
                    <p className="text-sm text-gray-400">
                      Connect your calendar to join and summarize meetings
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue button */}
            <button
              onClick={handleContinue}
              className="px-6 py-3 bg-[#9334E9] hover:bg-[#7928CA] transition-colors rounded-lg flex items-center justify-center gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {currentStep === 3 && (
          /* Email categorization step */
          <div className="w-full flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-6">
              <div className="w-12 h-12 rounded-full bg-[#2D1B40] flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#9334E9]" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-4 text-center">Categorize your inbox</h1>
            <p className="text-gray-400 text-center mb-12">
              Let Amurex organize your emails into smart categories
            </p>

            {/* Smart categorization toggle */}
            <div className="bg-[#111111] rounded-lg p-4 mb-8 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#9334E9]" />
                  <span className="font-medium">Smart categorization</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={smartCategorizationEnabled}
                    onChange={() => setSmartCategorizationEnabled(!smartCategorizationEnabled)}
                  />
                  <div className={`w-11 h-6 rounded-full peer ${smartCategorizationEnabled ? 'bg-[#9334E9]' : 'bg-gray-700'} peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                </label>
              </div>
            </div>

            {smartCategorizationEnabled && (
              <>
                <p className="text-sm text-gray-300 mb-4 w-full">
                  Select which categories you want Amurex to create:
                </p>

                {/* Categories grid */}
                <div className="grid grid-cols-2 gap-4 w-full mb-4">
                  {/* Important */}
                  <div 
                    className={`rounded-lg p-4 cursor-pointer border ${selectedCategories.includes('important') ? 'bg-[#2D1B40] border-[#9334E9]' : 'bg-[#111111] border-transparent'}`}
                    onClick={() => toggleCategory('important')}
                  >
                    <div className="flex items-center gap-2">
                      <Star className={`w-5 h-5 ${selectedCategories.includes('important') ? 'text-[#9334E9]' : 'text-gray-400'}`} />
                      <span className="font-medium">Important</span>
                    </div>
                  </div>

                  {/* Work */}
                  <div 
                    className={`rounded-lg p-4 cursor-pointer border ${selectedCategories.includes('work') ? 'bg-[#2D1B40] border-[#9334E9]' : 'bg-[#111111] border-transparent'}`}
                    onClick={() => toggleCategory('work')}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className={`w-5 h-5 ${selectedCategories.includes('work') ? 'text-[#9334E9]' : 'text-gray-400'}`} />
                      <span className="font-medium">Work</span>
                    </div>
                  </div>

                  {/* Personal */}
                  <div 
                    className={`rounded-lg p-4 cursor-pointer border ${selectedCategories.includes('personal') ? 'bg-[#2D1B40] border-[#9334E9]' : 'bg-[#111111] border-transparent'}`}
                    onClick={() => toggleCategory('personal')}
                  >
                    <div className="flex items-center gap-2">
                      <User className={`w-5 h-5 ${selectedCategories.includes('personal') ? 'text-[#9334E9]' : 'text-gray-400'}`} />
                      <span className="font-medium">Personal</span>
                    </div>
                  </div>

                  {/* Read Later */}
                  <div 
                    className={`rounded-lg p-4 cursor-pointer border ${selectedCategories.includes('read-later') ? 'bg-[#2D1B40] border-[#9334E9]' : 'bg-[#111111] border-transparent'}`}
                    onClick={() => toggleCategory('read-later')}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className={`w-5 h-5 ${selectedCategories.includes('read-later') ? 'text-[#9334E9]' : 'text-gray-400'}`} />
                      <span className="font-medium">Read Later</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-8 w-full">
                  Amurex will create these labels in your Gmail account and automatically categorize incoming emails.
                </p>
              </>
            )}

            {/* Complete setup button */}
            <button
              onClick={handleCompleteSetup}
              disabled={isProcessingEmails}
              className="w-full py-3 bg-[#9334E9] hover:bg-[#7928CA] transition-colors rounded-lg flex items-center justify-center gap-2"
            >
              {isProcessingEmails ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Setting up categories...</span>
                </>
              ) : (
                <>
                  <span>Complete Setup</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {showEmailStats && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-medium text-blue-800">Email Processing Complete</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Total emails found:</span> {emailStats.total}
                  </p>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Emails processed and categorized:</span> {emailStats.processed}
                  </p>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Emails stored in database:</span> {emailStats.stored}
                  </p>
                </div>
                <p className="mt-3 text-sm text-blue-600">
                  Redirecting to chat in a moment...
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 