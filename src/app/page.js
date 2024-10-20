"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Bell,
  MessageCircle,
  User,
  Home,
  Compass,
  Plus,
  Maximize2,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OnboardingPopup } from "@/components/OnboardingPopup";
import { NoteEditorTile } from '@/components/NoteEditorTile';
import { useDebounce } from '@/hooks/useDebounce';
import { PinTile } from '@/components/PinTile';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import FocusedEditor from '@/components/FocusedEditor';
import { Loader } from '@/components/Loader';
import localFont from 'next/font/local';

const louizeFont = localFont({
  src: './fonts/Louize.ttf',
  variable: '--font-louize',
});

export default function PinterestBoard() {
  const [session, setSession] = useState(null);
  const [pins, setPins] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [importType, setImportType] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusNoteContent, setFocusNoteContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchDocuments();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchDocuments();
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

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/searchAll', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const sizes = ["small", "medium", "large"];
        const newPins = data.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          image: (doc.url.includes('notion.so') || doc.url.includes('notion.site')) ? "/notion-page-thumbnail.png" : 
                 doc.url.includes('docs.google.com') ? "https://www.google.com/images/about/docs-icon.svg" : 
                 "/placeholder.svg?height=300&width=200",
          type: (doc.url.includes('notion.so') || doc.url.includes('notion.site')) ? "notion" : 
                doc.url.includes('docs.google.com') ? "google" : "other",
          size: sizes[Math.floor(Math.random() * sizes.length)],
          tags: doc.tags,
        }));
        setPins(newPins);
      } else {
        console.error('Error fetching documents:', data.error);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchPins = useCallback((term) => {
    const filteredPins = pins.filter(pin => 
      pin.title.toLowerCase().includes(term.toLowerCase()) ||
      pin.tags.some(tag => tag.toLowerCase().includes(term.toLowerCase()))
    );
    setPins(filteredPins);
  }, [pins]);

  const handleImportDocs = async (type) => {
    setImportType(type);
    // Here you would typically open a modal or redirect to the upload page
    // For now, we'll just refetch the documents to simulate an import
    await fetchDocuments();
    setShowOnboarding(false);
  };

  const handleSaveNote = useCallback(async (noteText) => {
    try {
      // Generate a unique filename
      const filename = `note_${Date.now()}.txt`;

      // Upload the note text to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filename, noteText);

      console.log('Uploaded note:', data);
      if (uploadError) throw uploadError;

      // Get the public URL of the uploaded file
      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('notes')
        .getPublicUrl(filename);

      if (urlError) throw urlError;

      // Save the note metadata to the database
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: publicUrl,
          title: noteText.substring(0, 50) + '...', 
          text: noteText 
        }),
      });

      const responseData = await response.json();
      if (responseData.success) {
        await fetchDocuments();
      } else {
        console.error('Error saving note:', responseData.error);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [fetchDocuments]);

  const handleOpenFocusMode = useCallback(() => {
    setIsFocusMode(true);
  }, []);

  const handleCloseFocusMode = useCallback(() => {
    setIsFocusMode(false);
    setFocusNoteContent('');
  }, []);

  const handleSaveFocusNote = useCallback(async (noteText) => {
    console.log('Saving focus note:', noteText);
    await handleSaveNote(noteText);
    handleCloseFocusMode();
  }, [handleSaveNote]);

  const handleAiSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setIsAiSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchTerm, searchType: 'ai' }),
      });
      const data = await response.json();
      if (data.results) {
        setPins(data.results.map(doc => ({
          id: doc.id,
          title: doc.title,
          image:  ( doc.url.includes('notion.so') || doc.url.includes('notion.site') ) ? "https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg" : 
                 doc.url.includes('docs.google.com') ? "https://www.google.com/images/about/docs-icon.svg" : 
                 "/placeholder.svg?height=300&width=200",
          type: ( doc.url.includes('notion.so') || doc.url.includes('notion.site') ) ? "notion" : 
                doc.url.includes('docs.google.com') ? "google" : "other",
          size: ["small", "medium", "large"][Math.floor(Math.random() * 3)],
          tags: doc.tags,
        })));
      }
    } catch (error) {
      console.error('Error during AI search:', error);
    } finally {
      setIsAiSearching(false);
    }
  }, [searchTerm]);

  const handleOpenFolder = useCallback((pin) => {
    router.push(`/folder/${pin.id}`);
  }, [router]);

  if (!session) {
    router.push('/signin');
    return null;
  }

  return (
    <div className={`flex h-screen overflow-hidden ${louizeFont.variable}`} style={{ backgroundColor: "var(--surface-color-2)" }}>
      {showOnboarding && (
        <OnboardingPopup
          onClose={() => setShowOnboarding(false)}
          onImport={handleImportDocs}
        />
      )}
      <aside className="w-16 shadow-md flex flex-col justify-between items-center py-4 fixed h-full z-50" style={{ backgroundColor: "var(--surface-color-2)" }}>
        <span className="text-4xl" role="img" aria-label="Dog emoji">
          🐶
        </span>
        <div className="flex flex-col items-center space-y-8 mb-4">
          <Button variant="ghost" size="icon">
            <Home className="h-6 w-6" style={{ color: "var(--color-4)" }} />
          </Button>
          <Button variant="ghost" size="icon">
            <Compass className="h-6 w-6" style={{ color: "var(--color-4)" }} />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-6 w-6" style={{ color: "var(--color-4)" }} />
          </Button>
          <Button variant="ghost" size="icon">
            <MessageCircle className="h-6 w-6" style={{ color: "var(--color-4)" }} />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-6 w-6" style={{ color: "var(--color-4)" }} />
          </Button>
          <Button variant="ghost" size="icon">
            <Plus className="h-6 w-6" style={{ color: "var(--color-4)" }} />
          </Button>
        </div>
      </aside>
      <main
        className="flex-1 overflow-y-auto ml-16"
        style={{ backgroundColor: "var(--surface-color-2)" }}
      >
        <div className="sticky top-0 z-40 w-full bg-opacity-90 backdrop-blur-sm" style={{ backgroundColor: "var(--surface-color-2)" }}>
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
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleAiSearch();
                  }
                }}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  />
              )}
            </div>
          </div>
        </div>
        <div className="p-8">
          {isLoading ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <NoteEditorTile onSave={handleSaveNote} onOpenFocusMode={handleOpenFocusMode} />
              {pins.map((pin) => (
                <PinTile key={pin.id} pin={pin} onClick={handleOpenFolder} />
              ))}
            </div>
          )}
        </div>
      </main>
      {isFocusMode && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-8">
          <Button variant="ghost" size="icon" onClick={handleCloseFocusMode} className="absolute top-4 right-4">
            <X className="h-6 w-6" />
          </Button>
          <FocusedEditor />
          <div className="flex justify-end mt-4">
            <Button onClick={() => handleSaveFocusNote(focusNoteContent)}>Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}
