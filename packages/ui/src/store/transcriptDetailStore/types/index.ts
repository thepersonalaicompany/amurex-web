import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface TranscriptType {
  id: string;
  meeting_id: string;
  title: string;
  date: string;
  time: string;
  summary: string;
  content: string;
  actionItems: string;
}

export type ChatMessageRole = "user" | "assistant";

export interface ChatMessageType {
  role: ChatMessageRole;
  content: string;
  // Optional timestamp if tracking message time is required
  timestamp?: Date;
  // Optional unique ID for each message (useful for React keys and updates)
  id?: string;

  // Optional error details if role is 'error'
  error?: {
    code: string;
    message: string;
  };
}

type CopyButtonTextType = "Copy share link" | "Copied!" | "Copy";

type EventType =
  | "web_summary_clicked"
  | "web_action_items_clicked"
  | "web_download_transcript"
  | "web_share_url_copied"
  | "web_share_notes_via_email"
  | "web_action_item_clicked";

export interface TranscriptDetailStoreTypes {
  memoryEnabled: boolean;
  setMemoryEnabled: (value: boolean) => void;

  loading: boolean;
  setLoading: (value: boolean) => void;

  transcript: TranscriptType | null;
  setTranscript: (value: TranscriptType) => void;

  fullTranscriptText: string;
  setFullTranscriptText: (value: string) => void;

  error: unknown;
  setError: (value: unknown) => void;

  isModalOpen: boolean;
  setIsModalOpen: (value: boolean) => void;

  isChatOpen: boolean;
  setIsChatOpen: (value: boolean) => void;

  isPreviewModalOpen: boolean;
  setIsPreviewModalOpen: (value: boolean) => void;

  chatMessages: ChatMessageType[];
  setChatMessages: (
    value: ChatMessageType[] | ((prev: ChatMessageType[]) => ChatMessageType[]),
  ) => void;

  chatInput: string;
  setChatInput: (value: string) => void;

  isSending: boolean;
  setIsSending: (value: boolean) => void;

  copyButtonText: CopyButtonTextType;
  setCopyButtonText: (value: CopyButtonTextType) => void;

  copyActionItemsText: "Copy" | "Copied!";
  setCopyActionItemsText: (value: "Copy" | "Copied!") => void;

  copyMeetingSummaryText: "Copy" | "Copied!";
  setCopyMeetingSummaryText: (value: "Copy" | "Copied!") => void;

  emails: [] | string[];
  setEmails: (value: string[]) => void;

  emailInput: string;
  setEmailInput: (value: string) => void;

  isMobile: boolean;
  setIsMobile: (value: boolean) => void;

  sharedWith: [] | string[];
  setSharedWith: (value: [] | string[]) => void;

  previewContent: string;
  setPreviewContent: (value: string) => void;

  isLoadingPreview: boolean;
  setIsLoadingPreview: (value: boolean) => void;

  session: null | { user: { id: string } };
  setSession: (value: null | { user: { id: string } }) => void;

  logUserAction: (
    userId: string,
    eventType: EventType,
    params: { id: string },
  ) => void;

  toggleModal: () => void;

  checkMobile: () => void;

  handleEmailInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  validateEmail: (email: string) => boolean;

  handleEmailInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  addEmail: () => void;

  removeEmail: (index: number) => void;

  sendEmails: (params: { id: string }, router: AppRouterInstance) => void;

  handleCopyLink: (params: { id: string }, router: AppRouterInstance) => void;

  handleDownload: () => void;

  handleActualDownload: (
    params: { id: string },
    router: AppRouterInstance,
  ) => void;

  handleActionItemClick: (params: { id: string }) => void;

  handleSummaryClick: (
    params: { id: string },
    router: AppRouterInstance,
  ) => void;

  fetchTranscript: (params: { id: string }, router: AppRouterInstance) => void;

  handleChatSubmit: (e: React.FormEvent<HTMLFormElement>) => void;

  fetchSession: (router: AppRouterInstance) => void;

  fetchMemoryStatus: (router: AppRouterInstance) => void;
}
