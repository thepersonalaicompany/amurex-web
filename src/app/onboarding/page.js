"use client";

import React, { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  FileText,
  Calendar,
  ArrowRight,
  Tag,
  Star,
  Briefcase,
  User,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";

// Create a client component that uses useSearchParams
function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(2);
  const [selectedTools, setSelectedTools] = useState([]);
  const [smartCategorizationEnabled, setSmartCategorizationEnabled] =
    useState(true);
  const [selectedCategories, setSelectedCategories] = useState([
    "important",
    "work",
    "personal",
  ]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState(0);
  const [emailStats, setEmailStats] = useState({
    processed: 0,
    stored: 0,
    total: 0,
  });
  const [showEmailStats, setShowEmailStats] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isNotionConnecting, setIsNotionConnecting] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [googleDocsConnected, setGoogleDocsConnected] = useState(false);
  const [activeSlide, setActiveSlide] = useState(1);
  const [slideProgress, setSlideProgress] = useState(0);
  const slideDuration = 13000; // 13 seconds in milliseconds
  const [authCompleted, setAuthCompleted] = useState(false);
  const [gifKey, setGifKey] = useState(0);

  // Check for connection success on component mount
  useEffect(() => {
    const connectionStatus = searchParams.get("connection");
    if (connectionStatus === "success") {
      // Check if we were connecting Gmail or Google Docs
      if (localStorage.getItem("pendingGmailConnect") === "true") {
        localStorage.removeItem("pendingGmailConnect");
        toast.success("Gmail connected successfully!");

        // Enable email tagging for the user
        enableEmailTagging();

        // INSTEAD OF REDIRECTING, TRIGGER THE ANIMATION
        setIsProcessingEmails(true);
        setProcessingStep(1);

        setTimeout(() => {
          setProcessingStep(2);

          let progress = 0;
          const progressInterval = setInterval(() => {
            progress += 2;
            setProcessingProgress(progress);

            if (progress >= 100) {
              clearInterval(progressInterval);
              setProcessingStep(3);
              // DO NOT advance to next step - wait for user to click Continue
            }
          }, 100);
        }, 1500);
      } else if (localStorage.getItem("pendingGoogleDocsImport") === "true") {
        localStorage.removeItem("pendingGoogleDocsImport");
        toast.success("Google Docs connected successfully!");

        // Start the complete import process
        startCompleteImportProcess();
      }
    }
  }, [searchParams]);

  // Add this useEffect to check if Google is already connected when the component mounts
  useEffect(() => {
    const checkGoogleConnection = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const { data: userData, error } = await supabase
            .from("users")
            .select("google_connected")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.error("Error checking Google connection:", error);
            return;
          }

          // If user has Google connected, update the state
          if (userData?.google_connected) {
            setIsGoogleConnected(true);
          }
        }
      } catch (error) {
        console.error("Error checking Google connection:", error);
      }
    };

    checkGoogleConnection();
  }, []);

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
        .from("users")
        .update({ email_tagging_enabled: true })
        .eq("id", session.user.id);

      if (error) {
        console.error("Error enabling email tagging:", error);
      } else {
        console.log("Email tagging enabled successfully");
      }
    } catch (error) {
      console.error("Error enabling email tagging:", error);
    }
  }, []);

  const handleConnectGmail = async () => {
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
            source: "onboarding",
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
      console.error("Error connecting to Google:", error);
      toast.error("Failed to connect to Google");
      setIsProcessingEmails(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnectGoogleDocs = useCallback(async () => {
    setIsProcessingEmails(true);
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
            source: "onboarding",
          }),
        });

        const data = await response.json();

        if (data.url) {
          localStorage.setItem("pendingGoogleDocsImport", "true");
          router.push(data.url);
        } else {
          console.error("Error starting Google OAuth flow:", data.error);
          toast.error("Failed to connect Google Docs. Please try again.");
          setIsProcessingEmails(false);
        }
      } else {
        toast.error("You must be logged in to connect Google Docs");
        setIsProcessingEmails(false);
      }
    } catch (error) {
      console.error("Error connecting Google Docs:", error);
      toast.error("Failed to connect Google Docs. Please try again.");
      setIsProcessingEmails(false);
    }
  }, [router]);

  // Function to handle the complete import process
  const startCompleteImportProcess = useEffect(() => {
    const checkOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const scope = params.get("scope");

      // If we have a code and scope, it's likely an OAuth callback
      if (code && scope) {
        // Show processing animation
        setIsProcessingEmails(true);

        // Simulate email processing with progress updates
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 5;
          setProcessingProgress(progress);

          // Update fake stats as we go
          setEmailStats({
            processed: Math.floor((progress / 100) * 1250),
            stored: Math.floor((progress / 100) * 850),
            total: 1250,
          });

          if (progress >= 100) {
            clearInterval(progressInterval);
            setShowEmailStats(true);
            setAuthCompleted(true);
            setIsProcessingEmails(false);
            // DO NOT redirect here
          }
        }, 250); // Update every 250ms for a total of ~5 seconds

        // Process the actual OAuth response
        try {
          // Your existing OAuth handling code
          // ...
          // DO NOT redirect here
        } catch (error) {
          console.error("Error processing OAuth callback:", error);
          clearInterval(progressInterval);
          setIsProcessingEmails(false);
        }
      }
    };

    checkOAuthCallback();
  }, [router]);

  const handleConnectNotion = async () => {
    setIsNotionConnecting(true);
    try {
      const response = await fetch("/api/notion/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "onboarding" }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to get Notion authorization URL");
      }
    } catch (error) {
      console.error("Error connecting to Notion:", error);
      toast.error("Failed to connect to Notion");
      setIsNotionConnecting(false);
    }
  };

  // Handle file selection for Obsidian
  const handleFileSelect = (e) => {
    const files = Array.from(
      e.target?.files || e.dataTransfer?.files || []
    ).filter((file) => file.name.endsWith(".md"));
    setSelectedFiles(files);
  };

  // Add drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("border-[#9334E9]");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-[#9334E9]");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-[#9334E9]");
    handleFileSelect(e);
  };

  const handleObsidianUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one Markdown file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const content = await file.text();

        const response = await fetch("/api/obsidian/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            content: content,
            userId: session.user.id,
          }),
        });

        if (!response.ok) throw new Error("Upload failed");

        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      toast.success("Markdown files uploaded successfully!");
      setSelectedFiles([]);

      // Move to next step after successful upload
      setCurrentStep(3);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleContinue = () => {
    if (currentStep === 2) {
      // Instead of going to step 3, complete the process
      if (selectedTools.includes("notion")) {
        handleConnectNotion();
      } else if (
        selectedTools.includes("obsidian") &&
        selectedFiles.length > 0
      ) {
        handleObsidianUpload();
      } else {
        // Skip to chat instead of going to step 3
        router.push("/search");
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleCompleteSetup = async () => {
    if (selectedTools.includes("google-docs")) {
      handleConnectGoogleDocs();
    } else if (smartCategorizationEnabled) {
      startCompleteImportProcess();
    } else {
      router.push("/search");
    }
  };

  const handleSkip = () => {
    router.push("/search");
  };

  const toggleTool = async (tool) => {
    if (tool === "notion") {
      // Check if Notion is already connected before starting OAuth flow
      if (notionConnected) {
        // If already connected, just show a toast notification
        toast.success("Notion is already connected!");
        return;
      }

      // If not connected, start OAuth flow
      handleConnectNotion();
      return;
    } else if (tool === "meetings") {
      window.open(
        "https://chromewebstore.google.com/detail/amurex-early-preview/dckidmhhpnfhachdpobgfbjnhfnmddmc",
        "_blank"
      );
      return;
    }

    // For other tools, keep the existing toggle behavior
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  };

  const toggleCategory = (category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Update the useEffect hook
  useEffect(() => {
    const checkNotionConnection = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const { data: userData, error } = await supabase
            .from("users")
            .select("notion_connected")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.error("Error checking Notion connection:", error);
            return;
          }

          // If user has Notion connected, update the state
          if (userData?.notion_connected) {
            setNotionConnected(true);
            // Add Notion to selected tools if it's connected
            if (!selectedTools.includes("notion")) {
              setSelectedTools((prev) => [...prev, "notion"]);
            }
          }
        }
      } catch (error) {
        console.error("Error checking Notion connection:", error);
      }
    };

    checkNotionConnection();
  }, []);

  useEffect(() => {
    const checkGoogleDocsConnection = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const { data: userData, error } = await supabase
            .from("users")
            .select("google_docs_connected")
            .eq("id", session.user.id)
            .single();

          if (error) {
            console.error("Error checking Google Docs connection:", error);
            return;
          }

          // If user has Google Docs connected, update the state
          if (userData?.google_docs_connected) {
            setGoogleDocsConnected(true);
            // Add Google Docs to selected tools if it's connected
            if (!selectedTools.includes("google-docs")) {
              setSelectedTools((prev) => [...prev, "google-docs"]);
            }
            // DO NOT advance to next step here
          }
        }
      } catch (error) {
        console.error("Error checking Google Docs connection:", error);
      }
    };

    checkGoogleDocsConnection();
  }, []);

  // Update the useEffect for auto-scrolling to include GIF reloading
  useEffect(() => {
    // Reset progress when slide changes
    setSlideProgress(0);

    // Increment the GIF key to force reload when slide changes to Knowledge Search
    if (activeSlide === 1) {
      setGifKey((prev) => prev + 1);
    }

    // Set up progress interval (updates every 100ms)
    const progressInterval = setInterval(() => {
      setSlideProgress((prev) => {
        const newProgress = prev + 100 / (slideDuration / 100);
        return newProgress > 100 ? 100 : newProgress;
      });
    }, 100);

    // Set up slide change interval
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev === 1 ? 0 : 1));
      setSlideProgress(0);
    }, slideDuration);

    // Clean up both intervals
    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [activeSlide]);

  // Function to trigger the animation
  const triggerFakeAnimation = () => {
    setIsProcessingEmails(true);

    // Step 1: Connecting to Gmail
    setProcessingStep(1);

    setTimeout(() => {
      // Step 2: Fetching emails
      setProcessingStep(2);

      // Start progress bar
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 2;
        setProcessingProgress(progress);

        if (progress >= 100) {
          clearInterval(progressInterval);

          // Step 3: Processing complete
          setProcessingStep(3);

          // Don't hide the processing UI, just mark it as complete
          setAuthCompleted(true);
        }
      }, 100);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      {/* Header */}
      <header className="relative p-4">
        {/* Logo positioned absolutely on the left */}
        <div className="absolute left-4 flex items-center gap-2">
          <img
            src="/amurex.png"
            alt="Amurex logo"
            className="h-10 w-10 rounded-full border-2 border-black"
            style={{ color: "var(--color-4)" }}
          />
          <span className="text-xl font-bold">Amurex</span>
        </div>

        {/* Progress bar centered in the page */}
        <div className="flex w-full flex-col items-center justify-center">
          <div className="mb-1 flex w-96 justify-between text-xs text-zinc-400">
            <span>
              {currentStep === 1
                ? "Connect Gmail"
                : "Connect knowledge sources"}
            </span>
            <span>
              {currentStep} of {totalSteps}
            </span>
          </div>
          <div className="h-1 w-96 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full bg-[#9334E9]"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center px-4">
        {currentStep === 1 && (
          <div className="flex min-h-[80vh] w-full flex-col items-start justify-between gap-12 md:flex-row">
            {/* Left side content - keep this compact */}
            <div className="flex w-full flex-col items-start md:w-1/3">
              {/* Add the disclaimer text */}
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-[#111111] p-4">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#2D1B40]">
                  <span className="text-sm font-bold text-[#9334E9]">i</span>
                </div>
                <p className="text-sm text-white">
                  We never send email on your behalf. We leave drafts for you to
                  edit and send. If it doesn&apos;t work out with us, we&apos;ll
                  leave your inbox as we found it.
                </p>
              </div>

              <h2 className="mb-2 text-2xl font-bold">Connect your Gmail</h2>
              <p className="mb-6 max-w-md text-gray-400">
                Connect your Gmail account to enable email categorization and
                search
              </p>

              {!isGoogleConnected ? (
                <div className="w-full">
                  {!isProcessingEmails ? (
                    <button
                      onClick={handleConnectGmail}
                      disabled={isConnecting}
                      className="mb-4 flex w-fit items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-6 py-3 text-black transition-colors hover:bg-gray-100"
                    >
                      {isConnecting ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            x="0px"
                            y="0px"
                            width="26"
                            height="26"
                            viewBox="0 0 48 48"
                          >
                            <path
                              fill="#fbc02d"
                              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12	s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20	s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                            ></path>
                            <path
                              fill="#e53935"
                              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039	l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                            ></path>
                            <path
                              fill="#4caf50"
                              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                            ></path>
                            <path
                              fill="#1565c0"
                              d="M43.611,20.083L43.595,20L42,20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                            ></path>
                          </svg>
                          Connect Google
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="mb-4 rounded-lg border border-gray-800 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-medium text-white">
                          Connecting to Gmail
                        </h3>
                        <span className="text-sm text-gray-400">
                          {processingProgress}%
                        </span>
                      </div>

                      {/* Progress steps */}
                      <div className="mb-4 mt-6 space-y-4">
                        {/* Step 1: Authentication */}
                        <div className="flex items-center gap-3">
                          {processingStep >= 1 ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M5 13L9 17L19 7"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border border-gray-600"></div>
                          )}
                          <span
                            className={
                              processingStep >= 1
                                ? "text-white"
                                : "text-gray-500"
                            }
                          >
                            Authorizing
                          </span>
                        </div>

                        {/* Step 2: Fetching emails */}
                        <div className="flex items-center gap-3">
                          {processingStep >= 2 ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M5 13L9 17L19 7"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          ) : processingStep === 1 ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-600">
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#9334E9] border-t-transparent"></div>
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border border-gray-600"></div>
                          )}
                          <span
                            className={
                              processingStep >= 2
                                ? "text-white"
                                : "text-gray-500"
                            }
                          >
                            Fetching emails
                          </span>
                        </div>

                        {/* Step 3: Processing complete */}
                        <div className="flex items-center gap-3">
                          {processingStep >= 3 ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M5 13L9 17L19 7"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          ) : processingStep === 2 ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-600">
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#9334E9] border-t-transparent"></div>
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border border-gray-600"></div>
                          )}
                          <span
                            className={
                              processingStep >= 3
                                ? "text-white"
                                : "text-gray-500"
                            }
                          >
                            Generating labels
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-gray-800">
                        <div
                          className="h-full bg-[#9334E9] transition-all duration-300"
                          style={{ width: `${processingProgress}%` }}
                        ></div>
                      </div>

                      {/* Continue button - only shown when processing is complete */}
                      {processingStep === 3 && (
                        <div className="mt-4 flex justify-center">
                          <button
                            onClick={() => {
                              setIsGoogleConnected(true);
                              setCurrentStep(2);
                            }}
                            className="flex items-center gap-2 rounded-lg border border-[#9334E9] bg-[#9334E9] px-6 py-2 text-white transition-colors hover:border-[#6D28D9] hover:bg-[#3c1671]"
                          >
                            Continue
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Test button */}
                  {/* <button
                    onClick={triggerFakeAnimation}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm mt-2"
                  >
                    Test Processing Animation
                  </button> */}
                </div>
              ) : (
                <div className="mb-8 flex w-full flex-col items-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2D1B40]">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 13L9 17L19 7"
                        stroke="#9334E9"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    Gmail Connected
                  </h3>
                  <p className="text-center text-gray-400">
                    Your Gmail account is already connected.
                  </p>
                </div>
              )}
            </div>

            {/* Right side image slider accordion with auto-scroll and progress bar */}
            <div className="w-full md:w-3/5">
              <div className="flex">
                <button
                  className={`rounded-tl-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeSlide === 1
                      ? "bg-[#9334E9] text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                  onClick={() => setActiveSlide(1)}
                >
                  Knowledge Search
                </button>
                <button
                  className={`rounded-tr-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeSlide === 0
                      ? "bg-[#9334E9] text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                  onClick={() => setActiveSlide(0)}
                >
                  Email Organization
                </button>
              </div>

              <div className="relative w-[650px] overflow-hidden rounded-bl-lg rounded-br-lg rounded-tr-lg border border-gray-800 shadow-2xl">
                {/* Knowledge Search slide (now first) */}
                <div
                  className={`transition-all duration-500 ${
                    activeSlide === 1
                      ? "opacity-100"
                      : "absolute inset-0 opacity-0"
                  }`}
                  style={{
                    transform:
                      activeSlide === 1 ? "translateX(0)" : "translateX(100%)",
                  }}
                >
                  <img
                    key={gifKey}
                    src={`/amurex-knowledge.gif?v=${gifKey}`}
                    alt="Amurex product demo"
                    className="h-auto w-full"
                  />
                  <p className="text-md bg-gray-900 p-2 text-gray-400">
                    Search and retrieve information instantly
                  </p>
                </div>

                {/* Email Organization slide (now second) */}
                <div
                  className={`transition-all duration-500 ${
                    activeSlide === 0
                      ? "opacity-100"
                      : "absolute inset-0 opacity-0"
                  }`}
                  style={{
                    transform:
                      activeSlide === 0 ? "translateX(0)" : "translateX(-100%)",
                  }}
                >
                  <img
                    src="/inbox.png"
                    alt="Amurex product screenshot"
                    className="h-auto w-full"
                  />
                  <p className="text-md bg-gray-900 p-2 text-gray-400">
                    Organize your emails with smart categories
                  </p>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 h-1 w-full bg-gray-800">
                  <div
                    className="h-full bg-[#9334E9] transition-all duration-100 ease-linear"
                    style={{ width: `${slideProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          /* Knowledge sources step */
          <div className="flex w-full flex-col items-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#1E1E1E]">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2D1B40]">
                <FileText className="h-6 w-6 text-[#9334E9]" />
              </div>
            </div>

            <h1 className="mb-4 text-center text-3xl font-bold">
              Connect your knowledge sources
            </h1>
            <p className="mb-12 text-center text-gray-400">
              Connect your existing knowledge sources to get more personalized
              responses
            </p>

            {/* Tools selection */}
            <div className="mb-8 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              {/* Notion */}
              <div
                className={`flex h-full flex-col justify-between rounded-lg border p-4 ${
                  selectedTools.includes("notion")
                    ? "border-green-500/30"
                    : "border-gray-700 bg-black"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D1B40]">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
                      alt="Notion"
                      className="h-6 w-6"
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
                  className={`mt-4 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    notionConnected
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "border border-[#9334E9] bg-[#9334E9] text-white hover:border-[#6D28D9] hover:bg-[#3c1671]"
                  }`}
                >
                  {isNotionConnecting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : notionConnected ? (
                    "Connected"
                  ) : (
                    "Connect"
                  )}
                </button>
              </div>

              {/* Obsidian */}
              <div
                className={`flex h-full flex-col justify-between rounded-lg border p-4 ${
                  selectedTools.includes("obsidian")
                    ? "border-green-500/30"
                    : "border-gray-700 bg-black"
                }`}
                onClick={() => toggleTool("obsidian")}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D1B40]">
                    <img
                      src="https://obsidian.md/images/obsidian-logo-gradient.svg"
                      alt="Obsidian"
                      className="h-6 w-6"
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
                  className="mt-4 rounded-md border border-[#9334E9] bg-[#9334E9] px-3 py-1.5 text-sm text-white transition-colors hover:border-[#6D28D9] hover:bg-[#3c1671]"
                >
                  {selectedTools.includes("obsidian") ? "Selected" : "Select"}
                </button>
              </div>

              {/* Google Docs */}
              <div className="flex h-full flex-col justify-between rounded-lg border border-green-500/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2D1B40]">
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
                <button className="mt-4 rounded-md bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700">
                  Connected
                </button>
              </div>
            </div>

            {/* Obsidian file upload area (shown only when Obsidian is selected) */}
            {selectedTools.includes("obsidian") && (
              <div className="mb-8 w-full">
                <div
                  className="cursor-pointer rounded-lg border-2 border-dashed border-gray-700 p-6 text-center transition-colors hover:border-[#9334E9]"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-upload").click()}
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
                    <p className="mt-1 text-sm text-gray-500">
                      Only .md files are supported
                    </p>
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium text-white">
                      Selected files ({selectedFiles.length})
                    </h4>
                    <ul className="max-h-40 overflow-y-auto rounded-lg bg-[#111111] p-2">
                      {selectedFiles.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between px-2 py-1 text-sm text-gray-300"
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
                        <div className="h-2.5 w-full rounded-full bg-gray-700">
                          <div
                            className="h-2.5 rounded-full bg-[#9334E9]"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="mt-1 text-sm text-gray-400">
                          Uploading... {uploadProgress.toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex w-full justify-center gap-4">
              <button
                onClick={() => {
                  // Mark onboarding as complete in localStorage if needed
                  localStorage.setItem("onboardingCompleted", "true");

                  // Redirect to chat page
                  window.location.href = "/search";
                }}
                className="flex items-center gap-2 rounded-lg border border-[#9334E9] bg-[#9334E9] px-6 py-2 text-white transition-colors hover:border-[#6D28D9] hover:bg-[#3c1671]"
              >
                Complete onboarding
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Show success message and continue button after auth is completed */}
        {authCompleted && !isProcessingEmails && (
          <div className="mt-8 flex w-full flex-col items-center rounded-lg border border-gray-800 bg-gray-900 p-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#2D1B40]">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 13L9 17L19 7"
                  stroke="#9334E9"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-medium text-white">
              Gmail Connected Successfully
            </h3>
            <p className="mb-6 text-center text-gray-400">
              We&apos;ve processed {emailStats.processed} emails and stored{" "}
              {emailStats.stored} for quick access.
            </p>
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 rounded-lg bg-[#9334E9] px-6 py-2 text-white transition-colors hover:bg-[#8429D0]"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Main component that wraps the content with Suspense
export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
