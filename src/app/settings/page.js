"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [notionConnected, setNotionConnected] = useState(false);
  const [googleDocsConnected, setGoogleDocsConnected] = useState(false);
  const [notionDocuments, setNotionDocuments] = useState([]);
  const router = useRouter();

  useEffect(() => {
    checkIntegrations();
  }, []);

  const checkIntegrations = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: user, error } = await supabase
        .from('users')
        .select('notion_connected, google_docs_connected')
        .eq('id', session.user.id)
        .single();

      if (user) {
        setNotionConnected(user.notion_connected);
        setGoogleDocsConnected(user.google_docs_connected);
      }
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      router.push('/signin');
    }
    setLoading(false);
  };

  const handleNotionConnect = async () => {
    window.location.href = '/api/notion';
  };

  const handleGoogleDocsConnect = async () => {
    // Implement Google Docs OAuth flow
    window.location.href = '/api/auth/google';
  };

  const fetchNotionDocuments = useCallback(async () => {
    if (notionConnected) {
      try {
        const response = await fetch('/api/notion/documents');
        const data = await response.json();
        if (data.success) {
          setNotionDocuments(data.documents);
        } else {
          console.error('Error fetching Notion documents:', data.error);
        }
      } catch (error) {
        console.error('Error fetching Notion documents:', error);
      }
    }
  }, [notionConnected]);

  useEffect(() => {
    if (notionConnected) {
      fetchNotionDocuments();
    }
  }, [notionConnected, fetchNotionDocuments]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Integrations</h2>
        <div className="space-y-4">
          <div>
            <Button 
              onClick={handleNotionConnect} 
              variant={notionConnected ? "outline" : "default"}
            >
              {notionConnected ? 'Notion Connected' : 'Connect Notion'}
            </Button>
          </div>
          <div>
            <Button 
              onClick={handleGoogleDocsConnect} 
              variant={googleDocsConnected ? "outline" : "default"}
            >
              {googleDocsConnected ? 'Google Docs Connected' : 'Connect Google Docs'}
            </Button>
          </div>
        </div>
      </div>

      {notionConnected && notionDocuments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Notion Documents</h2>
          <ul className="list-disc pl-5">
            {notionDocuments.map((doc) => (
              <li key={doc.id}>{doc.title}</li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={handleLogout} disabled={loading}>
        {loading ? 'Logging out...' : 'Logout'}
      </Button>
    </div>
  );
}
