"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { ArrowCircleRight, ChatCenteredDots, Stack, GitBranch, X } from "@phosphor-icons/react";
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [googleDocsConnected, setGoogleDocsConnected] = useState(false);
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
        .select('notion_connected, google_docs_connected')
        .eq('id', session.user.id)
        .single();
      console.log('user', user);

      if (user) {
          setNotionConnected(user.notion_connected);
          setGoogleDocsConnected(user.google_docs_connected);
        }
      }
    } catch (error) {
      console.error('Error checking integrations:', error);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    
    // Clear local storage and cookies
    localStorage.removeItem('brainex_session');
    Cookies.remove('brainex_session');
    
    // If in extension environment, send message to clear extension storage
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
      try {
        window.postMessage(
          { 
            type: 'BRAINEX_LOGOUT',
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
    <div className="container mx-auto px-4 py-8 min-h-screen ">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8 text-center ">Settings</h1>
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <ChatCenteredDots size={32} className="mr-2 text-blue-500" />
                Integrations
              </h2>
              <div className="space-y-6">
                <IntegrationButton
                  onClick={handleNotionConnect}
                  connected={notionConnected}
                  label="Notion"
                  icon={<GitBranch size={24} />}
                />
                <IntegrationButton
                  onClick={handleGoogleDocsConnect}
                  connected={googleDocsConnected}
                  label="Google Docs"
                  icon={<ArrowCircleRight size={24} />}
                />
                <Button 
                  onClick={importNotionDocuments} 
                  variant="default"
                  className="w-full py-3 text-lg"
                >
                  <Stack size={24} className="mr-2" />
                  Import Notion Documents
                </Button>
                <Button 
                  onClick={importGoogleDocs} 
                  variant="default"
                  className="w-full py-3 text-lg"
                >
                  <Stack size={24} className="mr-2" />
                  Import Google Docs
                </Button>
              </div>
            </div>
          </div>
          <Button onClick={handleLogout} disabled={loading}
            className="w-full py-3 text-lg bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </Button>
        </motion.div>
      </div>
      <ImportingModal isOpen={isImporting} source={importSource} onClose={() => setIsImporting(false)} />
    </div>
  );
}

function IntegrationButton({ onClick, connected, label, icon }) {
  return (
    <Button 
      onClick={onClick} 
      variant={connected ? "outline" : "default"}
      className={`w-full py-4 text-lg ${
        connected 
          ? 'border-green-500 text-green-600 bg-green-50 hover:bg-green-100 shadow-inner' 
          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg'
      } transition-all duration-300`}
    >
      {icon}
      <span className="ml-2">{connected ? `${label} Connected` : `Connect ${label}`}</span>
    </Button>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Importing {source}</h3>
          <p className="text-gray-600">This may take a while depending on the number of documents.</p>
          <p className="text-gray-600">Feel free to close this window and continue using the app.</p>
        </div>
      </motion.div>
    </div>
  );
}
