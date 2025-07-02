export interface EmailCategoriesType {
  to_respond: boolean;
  fyi: boolean;
  comment: boolean;
  notification: boolean;
  meeting_update: boolean;
  awaiting_reply: boolean;
  actioned: boolean;
  custom_properties: Record<string, boolean>;
}

export interface SampleEmailType {
  id: number;
  sender: string;
  subject: string;
  category: string;
  time: string;
}

interface GmailDataType {
  email_address: string;
  refresh_token: string;
  google_cohort: string;
  google_clients: {
    client_id: string;
    client_secret: string;
  }[];
}

export interface EmailsPageStoreType {
  sampleEmails: SampleEmailType[];
  filteredEmails: () => SampleEmailType[];

  userId: string | null;
  setUserId: (userId: string) => void;

  isProcessingEmails: boolean;
  setIsProcessingEmails: (value: boolean) => void;

  emailTaggingEnabled: boolean;
  setEmailTaggingEnabled: (value: boolean) => void;

  hasEmailRecord: boolean;
  setHasEmailRecord: (value: boolean) => void;

  emailAddress: string | null;
  setEmailAddress: (emailAddress: string) => void;

  refreshToken: string | null;
  setRefreshToken: (refreshToken: string) => void;

  googleClientId: string | null;
  setGoogleClientId: (googleClientId: string) => void;

  googleClientSecret: string | null;
  setGoogleClientSecret: (googleClientSecret: string) => void;

  gmailAccounts: GmailDataType[] | [];
  setGmailAccounts: (
    gmailAccounts:
      | GmailDataType[]
      | ((prev: GmailDataType[]) => GmailDataType[]),
  ) => void;

  categories: EmailCategoriesType;
  setCategories: (categories: EmailCategoriesType) => void;

  showAddAccountPopup: boolean;
  setShowAddAccountPopup: (value: boolean) => void;

  isConnectingGmail: boolean;
  setIsConnectingGmail: (value: boolean) => void;

  fetchUserId: () => void;

  fetchGmailCredentials: (uid: string) => void;

  fetchCategories: (uid: string) => void;

  fetchEmailTaggingStatus: (uid: string) => void;

  checkEmailRecord: (uid: string) => void;

  handleCategoryToggle: (category: string, checked: boolean) => void;

  processGmailLabels: () => void;

  handleGmailConnect: () => void;

  handleGmailDisconnect: (emailAddress: string) => void;

  handleEmailTaggingToggle: (checked: boolean) => void;

  handleEmailClick: (sender: string) => void;
}
