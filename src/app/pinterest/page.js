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
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PinterestBoard() {
  const [pins, setPins] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [importType, setImportType] = useState(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusNoteContent, setFocusNoteContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchPins(debouncedSearchTerm);
    } else {
      fetchDocuments();
    }
  }, [debouncedSearchTerm]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/searchAll');
      const data = await response.json();
      if (data.success) {
        const sizes = ["small", "medium", "large"];
        const newPins = data.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          image: doc.url.includes('notion.so') ? "/notion-page-thumbnail.png" : 
                 doc.url.includes('docs.google.com') ? "https://www.google.com/images/about/docs-icon.svg" : 
                 "/placeholder.svg?height=300&width=200",
          type: doc.url.includes('notion.so') ? "notion" : 
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
          image: doc.url.includes('notion.so') ? "/notion-page-thumbnail.png" : 
                 doc.url.includes('docs.google.com') ? "https://www.google.com/images/about/docs-icon.svg" : 
                 "/placeholder.svg?height=300&width=200",
          type: doc.url.includes('notion.so') ? "notion" : 
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

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--surface-color-2)" }}>
      {showOnboarding && (
        <OnboardingPopup
          onClose={() => setShowOnboarding(false)}
          onImport={handleImportDocs}
        />
      )}
      <aside className="w-16 shadow-md flex flex-col items-center py-4 space-y-8 fixed h-full z-50" style={{ backgroundColor: "var(--surface-color)" }}>
        <span className="text-4xl" role="img" aria-label="Dog emoji">
          🐶
        </span>
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
        <Button variant="ghost" size="icon" onClick={() => window.location.href = '/upload'}>
          <Plus className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
      </aside>
      <main
        className="flex-1 overflow-y-auto ml-16"
        style={{ backgroundColor: "var(--surface-color-2)" }}
      >
        <div className="sticky top-0 z-40 bg-opacity-90 backdrop-blur-sm" style={{ backgroundColor: "var(--surface-color-2)" }}>
          <div className="max-w-4xl mx-auto py-4 px-8 flex justify-between items-center">
            <div className="relative w-full">
              <Input
                type="search"
                placeholder="Search..."
                className="w-full text-4xl py-4 px-2 font-serif bg-transparent border-0 border-b-2 rounded-none focus:ring-0 transition-colors"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
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
              {isAiSearching && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Search className="animate-spin h-6 w-6" style={{ color: "var(--color-4)" }} />
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleOpenFocusMode} className="ml-4">
              <Maximize2 className="h-6 w-6" style={{ color: "var(--color-4)" }} />
            </Button>
          </div>
        </div>
        <div className="p-8">
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4">
            <NoteEditorTile onSave={handleSaveNote} onOpenFocusMode={handleOpenFocusMode} />
            {pins.map((pin) => (
              <PinTile key={pin.id} pin={pin} onClick={handleOpenFolder} />
            ))}
          </div>
        </div>
      </main>
      {isFocusMode && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-8">
          <Button variant="ghost" size="icon" onClick={handleCloseFocusMode} className="absolute top-4 right-4">
            <X className="h-6 w-6" />
          </Button>
          <textarea
            className="flex-grow resize-none border-none focus:ring-0 text-lg p-4"
            value={focusNoteContent}
            onChange={(e) => setFocusNoteContent(e.target.value)}
            placeholder="Start typing your note..."
            autoFocus
          />
          <div className="flex justify-end mt-4">
            <Button onClick={() => handleSaveFocusNote(focusNoteContent)}>Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}
