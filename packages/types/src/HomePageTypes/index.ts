import { SupabaseSession } from "@amurex/supabase";

export interface NoteEditorTileProps {
  onSave: (note: string) => void;
  onOpenFocusMode: () => void;
}

export type Size = "small" | "medium" | "large";

// PinPopover
export interface Pin {
  id: string;
  title: string;
  text?: string;
  image: string;
  type: "note" | "notion" | "google" | "google_docs" | "other";
  size?: Size;
  tags: string[];
  url?: string;
  created_at?: string;
}

export interface PinPopoverProps {
  pin: Pin;
  onClose: () => void;
}

export interface HomeDocumentRowType {
  id: string;
  user_id: string;
  title: string;
  url: string;
  tags: string[];
  created_at: string;
}

export interface HomeStoreType {
  // State
  session: SupabaseSession | null;
  pins: Pin[];
  isFocusMode: boolean;
  focusNoteContent: string;
  searchTerm: string;
  isAiSearching: boolean;
  isLoading: boolean;
  showIntegrationsPopup: boolean;

  // Actions
  setSession: (session: SupabaseSession | null) => void;
  setPins: (pins: Pin[] | ((prev: Pin[]) => Pin[])) => void;
  setIsFocusMode: (value: boolean) => void;
  setFocusNoteContent: (content: string) => void;
  setSearchTerm: (term: string) => void;
  setIsAiSearching: (value: boolean) => void;
  setIsLoading: (value: boolean) => void;
  setShowIntegrationsPopup: (value: boolean) => void;

  // Methods
  fetchDocuments: () => Promise<void>;
  searchPins: (term: string) => void;
  handleSaveNote: (noteText: string) => Promise<void>;
  handleAiSearch: () => Promise<void>;
}
