"use client";

import { create } from "zustand";
import { supabase } from "@amurex/supabase";
import { HomeDocumentRowType, HomeStoreType, Pin, Size } from "@amurex/types";

export const useHomeStore = create<HomeStoreType>((set, get) => ({
  // Initial state
  session: null,
  pins: [],
  isFocusMode: false,
  focusNoteContent: "",
  searchTerm: "",
  isAiSearching: false,
  isLoading: true,
  showIntegrationsPopup: false,

  // Setters
  setSession: (session) => set({ session }),
  setPins: (pins) =>
    set({ pins: typeof pins === "function" ? pins(get().pins) : pins }),
  setIsFocusMode: (isFocusMode) => set({ isFocusMode }),
  setFocusNoteContent: (focusNoteContent) => set({ focusNoteContent }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setIsAiSearching: (isAiSearching) => set({ isAiSearching }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setShowIntegrationsPopup: (showIntegrationsPopup) =>
    set({ showIntegrationsPopup }),

  // Methods
  fetchDocuments: async () => {
    try {
      const {
        data: { session: _session },
      } = await supabase.auth.getSession();

      if (!_session) {
        console.error("No active session");
        return;
      }

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", _session.user.id);

      if (error) throw error;

      if (data) {
        set({
          pins: data.map(
            (d: HomeDocumentRowType): Pin => ({
              id: d.id,
              title: d.title,
              image: "/placeholder.svg?height=300&width=200",
              type: "note",
              tags: d.tags ?? [],
              url: d.url,
              created_at: d.created_at,
            }),
          ),
        });
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  searchPins: (term: string) => {
    const { pins } = get();
    const lowered = term.toLowerCase();
    const filtered = pins.filter(
      (pin) =>
        pin.title.toLowerCase().includes(lowered) ||
        pin.tags.some((t) => t.toLowerCase().includes(lowered)),
    );
    set({ pins: filtered });
  },

  handleSaveNote: async (noteText: string) => {
    const { session, setPins } = get();
    try {
      const filename = `note_${Date.now()}.txt`;

      const [firstLine, ...rest] = noteText.split("\n");
      const title = firstLine || "Untitled Note";
      const content = rest.join("\n").trim();

      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(filename, noteText);

      if (uploadError) throw uploadError;

      let publicUrl: string;
      try {
        const { data } = supabase.storage.from("notes").getPublicUrl(filename);
        publicUrl = data.publicUrl;
      } catch (err: unknown) {
        console.error("Error getting public URL:", err);
        throw new Error("Failed to get public URL for the note");
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: publicUrl,
          title,
          text: content || title,
          created_at: new Date().toISOString(),
          session,
        }),
      });

      const json: { success: boolean; documentId?: string; error?: string } =
        await res.json();

      if (json.success && json.documentId) {
        const newPin: Pin = {
          id: json.documentId,
          title,
          image: "/placeholder.svg?height=300&width=200",
          type: "note",
          size: ["small", "medium", "large"][
            Math.floor(Math.random() * 3)
          ] as Size,
          tags: [],
          url: publicUrl,
          created_at: new Date().toISOString(),
        };
        setPins((prev) => [newPin, ...prev]);
      } else {
        console.error("Error saving note:", json.error);
      }
    } catch (err) {
      console.error("Error saving note:", err);
    }
  },

  handleAiSearch: async () => {
    const { searchTerm, session } = get();
    if (!searchTerm.trim()) return;

    set({ isAiSearching: true });
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTerm, searchType: "ai", session }),
      });

      const data: { results?: HomeDocumentRowType[] } = await res.json();

      if (data.results) {
        set({
          pins: data.results.map(
            (doc): Pin => ({
              id: doc.id,
              title: doc.title,
              image:
                doc.url.includes("notion.so") || doc.url.includes("notion.site")
                  ? "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg"
                  : doc.url.includes("docs.google.com")
                    ? "https://www.google.com/images/about/docs-icon.svg"
                    : "/placeholder.svg?height=300&width=200",
              type:
                doc.url.includes("notion.so") || doc.url.includes("notion.site")
                  ? "notion"
                  : doc.url.includes("docs.google.com")
                    ? "google"
                    : "other",
              tags: doc.tags ?? [],
              url: doc.url,
              created_at: doc.created_at,
            }),
          ),
        });
      }
    } catch (err) {
      console.error("Error during AI search:", err);
    } finally {
      set({ isAiSearching: false });
    }
  },
}));
