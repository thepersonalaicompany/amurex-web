"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { OnboardingPopup } from "@/components/OnboardingPopup";
import { NoteEditorTile } from '@/components/NoteEditorTile';
import { useDebounce } from '@/hooks/useDebounce';
import { PinTile } from '@/components/PinTile';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import FocusedEditor from '@/components/FocusedEditor';
import { Loader } from '@/components/Loader';
import localFont from 'next/font/local';
import { NotionConnectModal } from '@/components/NotionConnectModal';

const louizeFont = localFont({
  src: './fonts/Louize.ttf',
  variable: '--font-louize',
});


export default function HomePage() {
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
  const [showNotionPopup, setShowNotionPopup] = useState(true);

  useEffect(() => {
    console.log('Fetching session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session data:', session);
      setSession(session);
      if (session) {
        console.log('Session data:', session);
        console.log('User data:', session.user);
        fetchDocuments();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        console.log('Session data (on change):', session);
        console.log('User data (on change):', session.user);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    console.log('Code:', code);
    console.log('State:', state);
    
    if (code) {
      handleNotionCallback(code, state);
    }
  }, []);

  const handleNotionCallback = async (code, state) => {
    try {
      console.log('Session user ID:', session.user.id);
      const response = await fetch(`/api/notion/callback?code=${code}&state=${state}`, {
        method: 'GET',
      });

      const data = await response.json();
      if (data.success) {
        await supabase
        .from('users')
        .update({ notion_connected: true })
        .eq('id', session.user.id);
        console.log('Notion connected successfully');
        
        await importNotionPages();
      } else {
        console.error('Error connecting Notion:', data.error);
      }
    } catch (error) {
      console.error('Error handling Notion callback:', error);
    }
  };

  const importNotionPages = async () => {
    console.log('Importing Notion pages');
    try {

      const response = await fetch('/api/notion/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
      });
      const data = await response.json();
      if (data.success) {
        console.log('Notion pages imported successfully');
        fetchDocuments(); // Refresh the documents list
      } else {
        console.error('Error importing Notion pages:', data.error);
      }
    } catch (error) {
      console.error('Error importing Notion pages:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) {
        throw error;
      }

      if (data) {
        setPins(data);
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
      const filename = `note_${Date.now()}.txt`;

      const { data, error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filename, noteText);

      console.log('Uploaded note:', data);
      if (uploadError) throw uploadError;

      const { data: { publicUrl }, error: urlError } = supabase.storage
        .from('notes')
        .getPublicUrl(filename);

      if (urlError) throw urlError;

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: publicUrl,
          title: noteText.substring(0, 50) + '...', 
          text: noteText,
          session
        }),
      });

      const responseData = await response.json();
      if (responseData.success) {
        const newNote = {
          id: responseData.documentId,
          title: noteText.substring(0, 50) + '...',
          image: "/placeholder.svg?height=300&width=200",
          type: "note",
          size: ["small", "medium", "large"][Math.floor(Math.random() * 3)],
          tags: [],
          url: publicUrl
        };
        setPins(prevPins => [newNote, ...prevPins]);
        console.log('Note saved successfully');
      } else {
        console.error('Error saving note:', responseData.error);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, [session]);

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

  const fetchNotionDocuments = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        return;
      }

      const response = await fetch('/api/notion/documents', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const notionPins = data.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          content: doc.text || '',
          image: "/notion-page-thumbnail.png",
          type: "notion",
          size: ["small", "medium", "large"][Math.floor(Math.random() * 3)],
          tags: doc.tags || [],
          url: doc.url
        }));
        setPins(prevPins => [...prevPins, ...notionPins]);
      } else {
        console.error('Error fetching Notion documents:', data.error);
      }
    } catch (error) {
      console.error('Error fetching Notion documents:', error);
    }
  };

  const handleNotionConnect = () => {
    window.location.href = '/api/notion';
  };

  useEffect(() => {
    const handleNotionCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code) {
        try {
          const response = await fetch(`/api/notion/callback?code=${code}&state=${state}`);
          const data = await response.json();
          // fetch the supabase session here and then pass the user id to the backend
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session.user.id;

          if (data.success) {
            const { access_token, workspace_id, bot_id } = data;

            // Send the data to the backend to update the database
            const updateResponse = await fetch('/api/notion/completeIntegration', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token,
                workspace_id,
                bot_id,
                state,
                userId
              }),
            });

            const updateData = await updateResponse.json();
            if (updateData.success) {
              console.log('Notion connected successfully');
              // Optionally, refresh the page or update the UI
            } else {
              console.error('Error updating user:', updateData.error);
            }
          } else {
            console.error('Error connecting Notion:', data.error);
          }
        } catch (error) {
          console.error('Error handling Notion callback:', error);
        }
      }
    };

    handleNotionCallback();
  }, [router]);

  useEffect(() => {
    const checkNotionConnection = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: user, error } = await supabase
          .from('users')
          .select('notion_connected')
          .eq('id', session.user.id)
          .single();

        if (user && user.notion_connected) {
          setShowNotionPopup(false);
        }
      }
    };

    checkNotionConnection();
  }, []);

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className={`${louizeFont.variable} flex flex-col h-screen`} style={{ backgroundColor: "var(--surface-color-2)" }}>
      {showOnboarding && (
        <OnboardingPopup
          onClose={() => setShowOnboarding(false)}
          onImport={handleImportDocs}
        />
      )}
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
      <div className="flex-grow overflow-hidden">
        <div className="h-full overflow-y-auto p-8">
          {isLoading ? (
            <Loader />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-full">
              <NoteEditorTile onSave={handleSaveNote} onOpenFocusMode={handleOpenFocusMode} />
              {pins.map((pin) => (
                <PinTile key={pin.id} pin={pin} />
              ))}
            </div>
          )}
        </div>
      </div>
      {isFocusMode && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col p-8">
          <FocusedEditor onSave={handleSaveFocusNote} onClose={handleCloseFocusMode} />
        </div>
      )}
      {showNotionPopup && (
        <NotionConnectModal
          onClose={() => setShowNotionPopup(false)}
          onConnect={handleNotionConnect}
        />
      )}
    </div>
  );
}
