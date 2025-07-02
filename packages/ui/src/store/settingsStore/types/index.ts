import { SupabaseSession } from "@amurex/supabase";

export interface TeamMember {
  id: string;
  role: string;
  created_at: string;
  name: string | null;
  users: {
    id: string;
    email: string;
  } | null;
}

export interface SettingsStoreType {
  activeTab: string;
  setActiveTab: (tab: string) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;

  userEmail: string;
  setUserEmail: (email: string) => void;

  userId: string | null;
  setUserId: (id: string) => void;

  notionConnected: boolean;
  setNotionConnected: (connected: boolean) => void;

  omiConnected: boolean;
  setOmiConnected: (connected: boolean) => void;

  googleDocsConnected: boolean;
  setGoogleDocsConnected: (connected: boolean) => void;

  calendarConnected: boolean;
  setCalendarConnected: (connected: boolean) => void;

  notionDocuments: any[];
  setNotionDocuments: (documents: any[]) => void;

  isImporting: boolean;
  setIsImporting: (importing: boolean) => void;

  importSource: string;
  setImportSource: (source: string) => void;

  importProgress: number;
  setImportProgress: (progress: number) => void;

  memoryEnabled: boolean;
  setMemoryEnabled: (enabled: boolean) => void;

  createdAt: string;
  setCreatedAt: (createdAt: string) => void;

  emailNotificationsEnabled: boolean;
  setEmailNotificationsEnabled: (value: boolean) => void;

  showSignOutConfirm: boolean;
  setShowSignOutConfirm: (value: boolean) => void;

  isProcessingEmails: boolean;
  setIsProcessingEmails: (value: boolean) => void;

  emailLabelEnabled: boolean;
  setEmailLabelEnabled: (value: boolean) => void;

  processedEmailCount: number;
  setProcessedEmailCount: (count: number) => void;

  teamName: string;
  setTeamName: (name: string) => void;

  teamLocation: string;
  setTeamLocation: (location: string) => void;

  editingField: string | null;
  setEditingField: (field: string | null) => void;

  editedName: string;
  setEditedName: (name: string) => void;

  editedLocation: string;
  setEditedLocation: (location: string) => void;

  teamCreatedAt: string;
  setTeamCreatedAt: (createdAt: string) => void;

  teamMembers: TeamMember[];
  setTeamMembers: (
    updater: TeamMember[] | ((members: TeamMember[]) => TeamMember[]),
  ) => void;

  membersLoading: boolean;
  setMembersLoading: (loading: boolean) => void;

  currentUserRole: string | null;
  setCurrentUserRole: (role: string | null) => void;

  editingMemberId: string | null;
  setEditingMemberId: (id: string | null) => void;

  editedRole: string;
  setEditedRole: (role: string) => void;

  isInviteModalOpen: boolean;
  setIsInviteModalOpen: (open: boolean) => void;

  emailInput: string;
  setEmailInput: (email: string) => void;

  emails: string[];
  setEmails: (emails: string[]) => void;

  teamInviteCode: string;
  setTeamInviteCode: (code: string) => void;

  copyButtonText: "Copy URL" | "Copied!";
  setCopyButtonText: (text: "Copy URL" | "Copied!") => void;

  isMobile: boolean;
  setIsMobile: (value: boolean) => void;

  isObsidianModalOpen: boolean;
  setIsObsidianModalOpen: (open: boolean) => void;

  selectedFiles: File[];
  setSelectedFiles: (files: File[]) => void;

  uploadProgress: number;
  setUploadProgress: (progress: number) => void;

  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;

  session: SupabaseSession | null;
  setSession: (session: SupabaseSession | null) => void;

  gmailPermissionError: boolean;
  setGmailPermissionError: (error: boolean) => void;

  showBroaderAccessModal: boolean;
  setShowBroaderAccessModal: (value: boolean) => void;

  googleTokenVersion: "full";
  setGoogleTokenVersion: (version: number) => void;

  gmailConnected: boolean;
  setGmailConnected: (connected: boolean) => void;

  showWarningModal: boolean;
  setShowWarningModal: (value: boolean) => void;

  emailLabelingEnabled: boolean;
  setEmailLabelingEnabled: (enabled: boolean) => void;

  importGoogleDocs: () => void;

  importNotionDocuments: () => void;

  processGmailLabels: () => void;

  checkSession: () => void;

  checkIntegrations: () => Promise<boolean>;

  initiateLogOut: () => void;

  handleLogOut: () => void;

  connectNotion: () => void;

  connectOmi: () => void;

  handleMemoryToggle: (checked: boolean) => void;

  handleEmailNotificationsToggle: (checked: boolean) => void;

  handleGoogleCallback: () => void;

  logUserAction: (userId: string, eventType: string) => void;

  handleSave: (field: string) => void;

  getInitials: (fullName: string, email: string) => string;

  handleRoleUpdate: (memberId: string) => void;

  fetchTeamDetails: () => void;

  handleEmailInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  handleEmailInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  addEmail: () => void;

  removeEmail: (index: number) => void;

  handleCopyInviteLink: () => void;

  sendInvites: () => void;

  fetchTeamInviteCode: () => void;

  handleFileSelect: (
    e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLElement>,
  ) => void;

  handleDragOver: (e: React.DragEvent<HTMLElement>) => void;

  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void;

  handleDrop: (e: React.DragEvent<HTMLElement>) => void;

  handleObsidianUplaod: () => void;

  handleTabChange: (tab: string) => void;

  handleEmailLabelToggle: (checked: boolean) => void;

  fetchUserId: () => void;

  handleGoogleDocsConnect: () => void;
}
