"use client";

import { supabase } from "@amurex/supabase";
import { useOnboardingStore } from "@amurex/ui/store";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";

export const OnboardingClient = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const searchParams = useSearchParams();
  const {
    enableEmailTagging,
    setIsProcessingEmails,
    setProcessingStep,
    setProcessingProgress,
    startCompleteImportProcess,
    setIsGoogleConnected,
    setNotionConnected,
    selectedTools,
    setSelectedTools,
    checkGoogleDocsConnection,
    setSlideProgress,
    setGifKey,
    activeSlide,
    gifKey,
    slideProgress,
    slideDuration,
    setActiveSlide,
  } = useOnboardingStore();

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
              setSelectedTools([...selectedTools, "notion"]);
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
    checkGoogleDocsConnection();
  }, []);

  // Update the useEffect for auto-scrolling to include GIF reloading
  useEffect(() => {
    // Reset progress when slide changes
    setSlideProgress(0);

    // Increment the GIF key to force reload when slide changes to Knowledge Search
    if (activeSlide === 1) {
      setGifKey(gifKey + 1);
    }

    // Set up progress interval (updates every 100ms)
    const progressInterval = setInterval(() => {
      const newProgress = slideProgress + 100 / (slideDuration / 100);
      setSlideProgress(newProgress > 100 ? 100 : newProgress);
    }, 100);

    // Set up slide change interval
    const slideInterval = setInterval(() => {
      setActiveSlide(activeSlide === 1 ? 0 : 1);
      setSlideProgress(0);
    }, slideDuration);

    // Clean up both intervals
    return () => {
      clearInterval(progressInterval);
      clearInterval(slideInterval);
    };
  }, [activeSlide]);
  return <>{children}</>;
};
