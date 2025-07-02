"use client";

import React, {
  useEffect,
  useCallback,
  ChangeEvent,
  KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import localFont from "next/font/local";
import { supabase } from "@amurex/supabase";
import { useDebounce } from "@amurex/web/hooks/useDebounce";
import {
  Button,
  FocusedEditor,
  Input,
  Loader,
  NoteEditorTile,
  PinTile,
} from "@amurex/ui/components";
import { useHomeStore } from "@amurex/ui/store";

const louizeFont = localFont({
  src: "../fonts/Louize.ttf",
  variable: "--font-louize",
});

const HomeClient = (): JSX.Element => {
  const router = useRouter();

  const {
    pins,
    isFocusMode,
    searchTerm,
    isLoading,
    setSession,
    setIsFocusMode,
    setFocusNoteContent,
    setSearchTerm,
    setShowIntegrationsPopup,
    fetchDocuments,
    searchPins,
    handleSaveNote,
    handleAiSearch,
  } = useHomeStore();

  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);

  /* Redirect on mount */
  useEffect(() => {
    router.push("/search");
  }, [router]);

  /* Initial auth + listener */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: _session } }) => {
      setSession(_session);
      if (_session) fetchDocuments();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      setSession(_session);
      if (_session) fetchDocuments();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, fetchDocuments]);

  /* Search debounce */
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchPins(debouncedSearchTerm);
    } else {
      fetchDocuments();
    }
  }, [debouncedSearchTerm, searchPins, fetchDocuments]);

  /* Guard route if not logged in */
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session: _session },
      } = await supabase.auth.getSession();
      if (!_session) router.push("/web_app/signin");
    };
    checkSession();
  }, [router]);

  /* Check connected integrations */
  useEffect(() => {
    const checkConnections = async () => {
      const {
        data: { session: _session },
      } = await supabase.auth.getSession();

      if (_session) {
        const { data: user } = await supabase
          .from("users")
          .select("notion_connected, google_docs_connected")
          .eq("id", _session.user.id)
          .single();

        if (user && !user.notion_connected && !user.google_docs_connected) {
          setShowIntegrationsPopup(true);
        }
      }
    };

    checkConnections();
  }, [setShowIntegrationsPopup]);

  const handleOpenFocusMode = useCallback(
    () => setIsFocusMode(true),
    [setIsFocusMode],
  );

  const handleCloseFocusMode = useCallback(() => {
    setIsFocusMode(false);
    setFocusNoteContent("");
  }, [setIsFocusMode, setFocusNoteContent]);

  const handleSaveFocusNote = useCallback(
    async (noteText: string) => {
      await handleSaveNote(noteText);
      handleCloseFocusMode();
    },
    [handleSaveNote, handleCloseFocusMode],
  );

  const handleNotionConnect = (): void => router.push("/api/notion/auth");
  const handleGoogleDocsConnect = (): void => router.push("/api/google/auth");

  // Temporary early-return in original file
  const nope = "nope";
  if (nope === "nope") {
    return <div />;
  }

  return (
    <div className="hidden bg-black">
      <div
        className={`${louizeFont.variable} flex flex-col h-screen ml-16`}
        style={{ backgroundColor: "var(--surface-color-2)" }}
      >
        {/* search bar */}
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
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
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

        {/* pin grid */}
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

        {/* focus mode */}
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
  );
};

export default HomeClient;
