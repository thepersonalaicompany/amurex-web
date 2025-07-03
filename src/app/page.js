"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { NoteEditorTile } from "@/components/NoteEditorTile";
import { useDebounce } from "@/hooks/useDebounce";
import { PinTile } from "@/components/PinTile";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import FocusedEditor from "@/components/FocusedEditor";
import { Loader } from "@/components/Loader";
import localFont from "next/font/local";
import { Navbar } from "@/components/Navbar";

const louizeFont = localFont({
  src: "./fonts/Louize.ttf",
  variable: "--font-louize",
});

export default function HomePage() {
  const [session, setSession] = useState(null);
  const [pins, setPins] = useState([]);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusNoteContent, setFocusNoteContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showNotionPopup, setShowNotionPopup] = useState(true);
  const [showIntegrationsPopup, setShowIntegrationsPopup] = useState(false);

  useEffect(() => {
    // Redirect to /meetings when the component mounts
    router.push("/search");
  }, [router]);

  useEffect(() => {
    console.log("Fetching session");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Session data:", session);
      setSession(session);
      if (session) {
        console.log("Session data:", session);
        console.log("User data:", session.user);
        fetchDocuments();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        console.log("Session data (on change):", session);
        console.log("User data (on change):", session.user);
        fetchDocuments();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchPins(debouncedSearchTerm);
    } else {
      fetchDocuments();
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/web_app/signin");
      }
    };

    checkSession();
  }, [router]);

  const fetchDocuments = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session");
        return;
      }

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", session.user.id);

      if (error) {
        throw error;
      }

      if (data) {
        setPins(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPins = useCallback(
    (term) => {
      const filteredPins = pins.filter(
        (pin) =>
          pin.title.toLowerCase().includes(term.toLowerCase()) ||
          pin.tags.some((tag) => tag.toLowerCase().includes(term.toLowerCase()))
      );
      setPins(filteredPins);
    },
    [pins]
  );

  const handleSaveNote = useCallback(
    async (noteText) => {
      try {
        const filename = `note_${Date.now()}.txt`;

        // Split the note into title and content
        const lines = noteText.split("\n");
        const title = lines[0] || "Untitled Note";
        const content = lines.slice(1).join("\n").trim();

        const { data, error: uploadError } = await supabase.storage
          .from("notes")
          .upload(filename, noteText);

        console.log("Uploaded note:", data);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
          error: urlError,
        } = supabase.storage.from("notes").getPublicUrl(filename);

        if (urlError) throw urlError;

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: publicUrl,
            title: title,
            text: content || title,
            created_at: new Date().toISOString(),
            session,
          }),
        });

        const responseData = await response.json();
        if (responseData.success) {
          const newNote = {
            id: responseData.documentId,
            title: title,
            image: "/placeholder.svg?height=300&width=200",
            type: "note",
            size: ["small", "medium", "large"][Math.floor(Math.random() * 3)],
            tags: [],
            url: publicUrl,
            created_at: new Date().toISOString(),
          };
          setPins((prevPins) => [newNote, ...prevPins]);
          console.log("Note saved successfully");
        } else {
          console.error("Error saving note:", responseData.error);
        }
      } catch (error) {
        console.error("Error saving note:", error);
      }
    },
    [session]
  );

  const handleOpenFocusMode = useCallback(() => {
    setIsFocusMode(true);
  }, []);

  const handleCloseFocusMode = useCallback(() => {
    setIsFocusMode(false);
    setFocusNoteContent("");
  }, []);

  const handleSaveFocusNote = useCallback(
    async (noteText) => {
      console.log("Saving focus note:", noteText);
      await handleSaveNote(noteText);
      handleCloseFocusMode();
    },
    [handleSaveNote]
  );

  const handleAiSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setIsAiSearching(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchTerm,
          searchType: "ai",
          session: session,
        }),
      });
      const data = await response.json();
      if (data.results) {
        console.log("Data results", data.results);
        setPins(
          data.results.map((doc) => ({
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
            tags: doc.tags,
          }))
        );
      }
    } catch (error) {
      console.error("Error during AI search:", error);
    } finally {
      setIsAiSearching(false);
    }
  }, [searchTerm]);

  const handleNotionConnect = () => {
    router.push("/api/notion/auth");
  };

  const handleGoogleDocsConnect = () => {
    router.push("/api/google/auth");
  };

  useEffect(() => {
    const checkConnections = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: user, error } = await supabase
          .from("users")
          .select("notion_connected, google_docs_connected")
          .eq("id", session.user.id)
          .single();

        if (user && !user.notion_connected && !user.google_docs_connected) {
          setShowIntegrationsPopup(true);
        }
      }
    };

    checkConnections();
  }, []);

  // if (!session) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <Loader />
  //     </div>
  //   );
  // }

  const nope = "nope";

  if (nope === "nope") {
    return <Navbar />;
  }
  return (
    <>
      <Navbar />
      <div className="hidden bg-black">
        <div
          className={`${louizeFont.variable} flex flex-col h-screen ml-16`}
          style={{ backgroundColor: "var(--surface-color-2)" }}
        >
          <div
            className="sticky top-0 z-40 w-full bg-opacity-90 backdrop-blur-sm"
            style={{ backgroundColor: "var(--surface-color-2)" }}
          >
            <div className="w-full py-4 px-8 flex justify-between items-center">
              <div className="relative w-full flex items-center">
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full text-6xl py-4 px-2 font-serif bg-transparent border-0 border-b-2 rounded-none focus:ring-0 transition-colors"
                  style={{
                    fontFamily: "var(--font-louize), serif",
                    borderColor: "var(--line-color)",
                    color: "var(--color)",
                  }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleAiSearch();
                    }
                  }}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex-grow overflow-hidden">
            <div className="h-full overflow-y-auto p-8">
              {isLoading ? (
                <Loader />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-full">
                  <NoteEditorTile
                    onSave={handleSaveNote}
                    onOpenFocusMode={handleOpenFocusMode}
                  />
                  {pins.map((pin) => (
                    <PinTile key={pin.id} pin={pin} />
                  ))}
                </div>
              )}
            </div>
          </div>
          {isFocusMode && (
            <div className="fixed inset-0 bg-white z-50 flex flex-col p-8">
              <FocusedEditor
                onSave={handleSaveFocusNote}
                onClose={handleCloseFocusMode}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
