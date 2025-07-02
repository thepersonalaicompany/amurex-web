"use client";

import { create } from "zustand";
import { OnboardingStoreType } from "./types";
import { supabase } from "@amurex/supabase";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export const useOnboardingStore = create<OnboardingStoreType>((set, get) => ({
  slideDuration: 13000,

  // State
  currentStep: 1,
  setCurrentStep: (step) => set({ currentStep: step }),

  totalSteps: 2,
  setTotalSteps: (steps) => set({ totalSteps: steps }),

  selectedTools: [],
  setSelectedTools: (tools) => set({ selectedTools: tools }),

  smartCategorizationEnabled: true,
  setSmartCategorizationEnabled: (enabled) =>
    set({ smartCategorizationEnabled: enabled }),

  selectedCategories: ["important", "work", "personal"],
  setSelectedCategories: (categories) =>
    set({ selectedCategories: categories }),

  isConnecting: false,
  setIsConnecting: (connecting) => set({ isConnecting: connecting }),

  isProcessingEmails: false,
  setIsProcessingEmails: (processing) =>
    set({ isProcessingEmails: processing }),

  processingProgress: 0,
  setProcessingProgress: (progress) => set({ processingProgress: progress }),

  processingStep: 1,
  setProcessingStep: (step) => set({ processingStep: step }),

  emailStats: {
    processed: 0,
    stored: 0,
    total: 0,
  },
  setEmailStats: (stats) => set({ emailStats: stats }),

  showEmailStats: false,
  setShowEmailStats: (value) => set({ showEmailStats: value }),

  selectedFiles: [],
  setSelectedFiles: (files) => set({ selectedFiles: files }),

  isUploading: false,
  setIsUploading: (uploading) => set({ isUploading: uploading }),

  uploadProgress: 0,
  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  isNotionConnecting: false,
  setIsNotionConnecting: (connecting) =>
    set({ isNotionConnecting: connecting }),

  isGoogleConnecting: false,
  setIsGoogleConnecting: (connecting) =>
    set({ isGoogleConnecting: connecting }),

  isGoogleConnected: false,
  setIsGoogleConnected: (connected) => set({ isGoogleConnected: connected }),

  notionConnected: false,
  setNotionConnected: (connected) => set({ notionConnected: connected }),

  googleDocsConnected: false,
  setGoogleDocsConnected: (connected) =>
    set({ googleDocsConnected: connected }),

  activeSlide: 1,
  setActiveSlide: (slide) => set({ activeSlide: slide }),

  slideProgress: 0,
  setSlideProgress: (progress) => set({ slideProgress: progress }),

  authCompleted: false,
  setAuthCompleted: (completed) => set({ authCompleted: completed }),

  gifKey: 0,
  setGifKey: (key) => set({ gifKey: key }),

  // Functions
  enableEmailTagging: async () => {
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
  },

  handleConnectGmail: async () => {
    const router = useRouter();
    const { setIsConnecting } = get();
    setIsConnecting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const response = await fetch("/api/google/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      setIsConnecting(false);
    } finally {
      setIsConnecting(false);
    }
  },

  handleConnectGoogleDocs: async () => {
    const router = useRouter();
    const { setIsProcessingEmails } = get();
    setIsProcessingEmails(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const response = await fetch("/api/google/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
  },

  startCompleteImportProcess: () => {
    const {
      setIsProcessingEmails,
      setProcessingProgress,
      setEmailStats,
      setShowEmailStats,
      setAuthCompleted,
    } = get();

    const params = new URLSearchParams(window.location.search);

    const code = params.get("code");
    const scope = params.get("scope");

    if (code && scope) {
      setIsProcessingEmails(true);

      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 5;
        setProcessingProgress(progress);

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
        }
      }, 250);

      // Following code is copied and pasted from original codebase
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
  },

  handleConnectNotion: async () => {
    const { setIsNotionConnecting } = get();
    setIsNotionConnecting(true);
    try {
      const response = await fetch("/api/notion/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "onboarding" }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to get Notion authorization URL");
      }

      setIsNotionConnecting(false);
    } catch (error) {
      console.error("Error connecting to Notion:", error);
      toast.error("Failed to connect to Notion");
      setIsNotionConnecting(false);
    }
  },

  handleFileSelect: (e) => {
    const files = Array.from(
      (e.target as HTMLInputElement)?.files ||
        (e as DragEvent).dataTransfer?.files ||
        [],
    ).filter((file: File) => file.name.endsWith(".md"));
    get().setSelectedFiles(files);
  },

  handleDragOver: (e) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.classList.add("border-[#9334E9]");
  },

  handleDragLeave: (e) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove("border-[#9334E9]");
  },

  handleDrop: (e) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove("border-[#9334E9]");
    get().handleFileSelect(e);
  },

  handleObsidianUpload: async () => {
    const {
      selectedFiles,
      setIsUploading,
      setUploadProgress,
      setCurrentStep,
      setSelectedFiles,
    } = get();
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
        const file = selectedFiles[i] as File;
        const content = await file.text();

        const response = await fetch("/api/obsidian/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

      setCurrentStep(3);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  },

  handleContinue: () => {
    const router = useRouter();
    const {
      currentStep,
      selectedTools,
      handleConnectNotion,
      handleObsidianUpload,
      selectedFiles,
    } = get();

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
        router.push("/search");
      }
    } else {
      set({ currentStep: currentStep + 1 });
    }
  },

  handleCompleteSetup: () => {
    const router = useRouter();
    const {
      selectedTools,
      handleConnectGoogleDocs,
      startCompleteImportProcess,
      smartCategorizationEnabled,
    } = get();

    if (selectedTools.includes("google-docs")) {
      handleConnectGoogleDocs();
    } else if (smartCategorizationEnabled) {
      startCompleteImportProcess();
    } else {
      router.push("/search");
    }
  },

  handleSkip: () => {
    const router = useRouter();
    router.push("/search");
  },

  toggleTool: async (tool) => {
    const {
      selectedTools,
      setSelectedTools,
      handleConnectNotion,
      notionConnected,
    } = get();

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
        "_blank",
      );
      return;
    }

    // For other tools, keep the existing toggle behavior
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool));
    } else {
      setSelectedTools([...selectedTools, tool]);
    }
  },

  toggleCategory: (category) => {
    const { selectedCategories, setSelectedCategories } = get();
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  },

  checkNotionConnection: async () => {
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
          const { selectedTools, setSelectedTools } = get();
          // Add Notion to selected tools if it's connected
          if (!selectedTools.includes("notion")) {
            setSelectedTools([...selectedTools, "notion"]);
          }
        }
      }
    } catch (error) {
      console.error("Error checking Notion connection:", error);
    }
  },

  checkGoogleDocsConnection: async () => {
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

        if (userData?.google_docs_connected) {
          const { selectedTools, setSelectedTools, setGoogleDocsConnected } =
            get();
          setGoogleDocsConnected(true);
          // Add Google Docs to selected tools if it's connected
          if (!selectedTools.includes("google-docs")) {
            setSelectedTools([...selectedTools, "google-docs"]);
          }
        }
      }
    } catch (error) {
      console.error("Error checking Google Docs connection:", error);
    }
  },
}));
