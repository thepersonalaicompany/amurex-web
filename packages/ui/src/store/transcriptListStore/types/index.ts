import { Router } from "next/dist/client/router";
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
  team_name: string;
}

interface UserTeamsType {
  team_id: string;
  teams: {
    id: string;
    team_name: string;
  };
}

export interface TrascriptListStoreType {
  searchTerm: string;
  setSearchTerm: (value: string) => void;

  transcripts: TranscriptType[];
  setTranscripts: (transcripts: TranscriptType[]) => void;

  loading: boolean;
  setLoading: (loading: boolean) => void;

  error: unknown;
  setError: (error: unknown) => void;

  filter: string;
  setFilter: (filter: string) => void;

  userTeams: UserTeamsType[];
  setUserTeams: (teams: UserTeamsType[]) => void;

  emailNotificationsEnabled: boolean;
  setEmailNotificationsEnabled: (value: boolean) => void;

  fetchTranscripts: (router: AppRouterInstance) => Promise<void>;

  fetchUserTeams: () => Promise<void>;

  fetchUserSettings: () => Promise<void>;

  handleEmailNotificationsToggle: (checkeed: boolean) => void;

  formatTranscripts: (data: any) => TranscriptType[];
}
