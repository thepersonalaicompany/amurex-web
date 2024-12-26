"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, FileText, Cloud, Github, Bug } from 'lucide-react';
import Cookies from 'js-cookie';
import { X } from "@phosphor-icons/react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [googleDocsConnected, setGoogleDocsConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [notionDocuments, setNotionDocuments] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSource, setImportSource] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkIntegrations();
  }, []);

  const checkIntegrations = async () => {
    try {
      console.log('checkIntegrations');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
      const { data: user, error } = await supabase
        .from('users')
        .select('notion_connected, google_docs_connected, calendar_connected')
        .eq('id', session.user.id)
        .single();
      console.log('user', user);

      if (user) {
          setNotionConnected(user.notion_connected);
          setGoogleDocsConnected(user.google_docs_connected);
          setCalendarConnected(user.calendar_connected);
        }
      }
    } catch (error) {
      console.error('Error checking integrations:', error);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    
    // Clear local storage and cookies
    console.log('Clearing cookies');
    localStorage.removeItem('amurex_session');
    Cookies.remove('amurex_session', { 
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });
    
    // If in extension environment, send message to clear extension storage
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
      try {
        window.postMessage(
          { 
            type: 'AMUREX_LOGOUT',
          }, 
          '*'
        );
      } catch (err) {
        console.error('Error sending logout message to extension:', err);
      }
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      router.push('/signin');
    }
    
    setLoading(false);
  };

  const handleNotionConnect = () => {
    router.push('/api/notion/auth');
  };

  const handleGoogleDocsConnect = async () => {
    console.log('handleGoogleDocsConnect');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/google/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const data = await response.json();
        if (data.url) {
          router.push(data.url);
        } else {
          console.error('Error starting Google OAuth flow:', data.error);
        }
      }
    } catch (error) {
      console.error('Error connecting Google Docs:', error);
    }
  };

  const handleCalendarConnect = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/google/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const data = await response.json();
        if (data.url) {
          router.push(data.url);
        } else {
          console.error('Error starting Google OAuth flow:', data.error);
        }
      }
    } catch (error) {
      console.error('Error connecting Google services:', error);
    }
  };

  const importNotionDocuments = useCallback(async () => {
    if (notionConnected) {
      setIsImporting(true);
      setImportSource('Notion');
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const response = await fetch('/api/notion/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session: session }),
        });
        const data = await response.json();
        
        if (data.success) {
          setNotionDocuments(data.documents);
        } else {
          console.log('Data:', data);
          console.error('Error importing Notion documents:', data.error);
        }
      } catch (error) {
          console.log('Error:', error);
        console.error('Error importing Notion documents:', error);
      } finally {
        setTimeout(() => {
          setIsImporting(false);
          setImportSource('');
          setImportProgress(0);
        }, 1000);
      }
    }
  }, [notionConnected]);

  const importGoogleDocs = useCallback(async () => {
    if (googleDocsConnected) {
      setIsImporting(true);
      setImportSource('Google Docs');
      const { data: { session } } = await supabase.auth.getSession();
      try {
        const response = await fetch('/api/google/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session: session }),
        });
        const data = await response.json();
        
        if (data.success) {
          console.log('Google Docs imported successfully');
        } else {
          console.error('Error importing Google docs:', data.error);
        }
      } catch (error) {
        console.error('Error importing Google docs:', error);
      } finally {
        setTimeout(() => {
          setIsImporting(false);
          setImportSource('');
          setImportProgress(0);
        }, 1000);
      }
    }
  }, [googleDocsConnected]);

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6 py-10">
            <div className="space-y-8">
              {/* Cloud Sync Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                      <Cloud className="w-5 h-5 text-purple-500" />
                      Memory
                    </h2>
                    <p className="text-sm text-zinc-400">
                      Keep your notes synced across devices
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600 cursor-not-allowed"
                    disabled={true}
                  >
                    Coming Soon
                  </Button>
                </div>
                <div className="text-sm text-zinc-400">
                  Feature coming soon
                </div>
              </div>
              {/* Integrations Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  Integrations
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <div className="flex items-center gap-4">
                      <FileText className="w-6 h-6 text-purple-500" />
                      <div>
                        <h3 className="font-medium text-white">Import Notion Documents</h3>
                        <p className="text-sm text-zinc-400">Sync your Notion pages</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600 cursor-not-allowed"
                      disabled={true}
                    >
                      Coming Soon
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <div className="flex items-center gap-4">
                      <FileText className="w-6 h-6 text-purple-500" />
                      <div>
                        <h3 className="font-medium text-white">Import Google Docs</h3>
                        <p className="text-sm text-zinc-400">Sync your Google documents</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="bg-zinc-700 text-zinc-300 hover:bg-zinc-600 cursor-not-allowed"
                      disabled={true}
                    >
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </div>

              {/* Report a bug */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                      <Bug className="w-5 h-5 text-purple-500" />
                      Encounter an issue?
                    </h2>
                    <p className="text-sm text-zinc-400">
                      Help us improve by reporting issues
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="bg-zinc-800 hover:bg-zinc-700 text-white whitespace-nowrap flex items-center"
                    onClick={() => window.open('https://github.com/thepersonalaicompany/amurex/issues/new', '_blank')}
                  >
                    <Github className="w-5 h-5 text-purple-500 mr-2" />
                    Report Issue
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">

          <Button 
            variant="destructive" 
            className="w-full bg-red-500 hover:bg-red-600 text-white py-6 text-lg"
            onClick={handleLogout}
            disabled={loading}
          >
            {loading ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
      <ImportingModal isOpen={isImporting} source={importSource} onClose={() => setIsImporting(false)} />
    </div>
  );
}

function ImportingModal({ isOpen, source, onClose }) {
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="bg-zinc-900 border-zinc-800 max-w-sm w-full mx-4">
        <CardContent className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="text-center">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Importing {source}</h3>
            <p className="text-sm text-zinc-400">This may take a while depending on the number of documents.</p>
            <p className="text-sm text-zinc-400 mt-2">Feel free to close this window and continue using the app.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
