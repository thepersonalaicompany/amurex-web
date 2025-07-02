import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams } from "next/navigation";
import { ChangeEvent } from "react";

export interface OnboardingStoreType {
  slideDuration: number;

  currentStep: number;
  setCurrentStep: (step: number) => void;

  totalSteps: number;
  setTotalSteps: (steps: number) => void;

  selectedTools: string[];
  setSelectedTools: (tools: string[]) => void;

  smartCategorizationEnabled: boolean;
  setSmartCategorizationEnabled: (enabled: boolean) => void;

  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;

  isConnecting: boolean;
  setIsConnecting: (connecting: boolean) => void;

  isProcessingEmails: boolean;
  setIsProcessingEmails: (processing: boolean) => void;

  processingProgress: number;
  setProcessingProgress: (progress: number) => void;

  processingStep: number;
  setProcessingStep: (step: number) => void;

  emailStats: {
    processed: number;
    stored: number;
    total: number;
  };
  setEmailStats: (stats: {
    processed: number;
    stored: number;
    total: number;
  }) => void;

  showEmailStats: boolean;
  setShowEmailStats: (value: boolean) => void;

  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;

  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;

  uploadProgress: number;
  setUploadProgress: (progress: number) => void;

  isNotionConnecting: boolean;
  setIsNotionConnecting: (connecting: boolean) => void;

  isGoogleConnecting: boolean;
  setIsGoogleConnecting: (connecting: boolean) => void;

  notionConnected: boolean;
  setNotionConnected: (connected: boolean) => void;

  isGoogleConnected: boolean;
  setIsGoogleConnected: (connected: boolean) => void;

  googleDocsConnected: boolean;
  setGoogleDocsConnected: (connected: boolean) => void;

  activeSlide: number;
  setActiveSlide: (slide: number) => void;

  slideProgress: number;
  setSlideProgress: (progress: number) => void;

  authCompleted: boolean;
  setAuthCompleted: (completed: boolean) => void;

  gifKey: number;
  setGifKey: (key: number) => void;

  enableEmailTagging: () => void;

  handleConnectGmail: () => void;

  handleConnectGoogleDocs: () => void;

  startCompleteImportProcess: () => void;

  handleConnectNotion: () => void;

  handleFileSelect: (e: DragEvent | ChangeEvent<HTMLInputElement>) => void;

  handleDragOver: (e: DragEvent) => void;

  handleDragLeave: (e: DragEvent) => void;

  handleDrop: (e: DragEvent) => void;

  handleObsidianUpload: () => void;

  handleContinue: () => void;

  handleCompleteSetup: () => void;

  handleSkip: () => void;

  toggleTool: (tool: string) => void;

  toggleCategory: (category: string) => void;

  checkNotionConnection: () => void;

  checkGoogleDocsConnection: () => void;
}
