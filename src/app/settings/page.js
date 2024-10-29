"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { ArrowCircleRight, ChatCenteredDots, Stack, GitBranch, X } from "@phosphor-icons/react";
import { motion } from 'framer-motion';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // This needs to be your OpenAI API key
});

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      router.push('/signin');
    }
    setLoading(false);
  };

  const handleNotionConnect = () => {
    router.push('/api/notion');
  };

  const handleGoogleDocsConnect = async () => {
    console.log('handleGoogleDocsConnect');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/auth/google', {
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
    console.log('importNotionDocuments', notionConnected);
    if (notionConnected) {
      const { data: { session } } = await supabase.auth.getSession();
      try {
        console.log('Importing Notion documents');
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
          
          // Process each document for embeddings
          for (const doc of data.documents) {
            const textSplitter = new RecursiveCharacterTextSplitter({
              chunkSize: 1000,
              chunkOverlap: 200,
            });
            
            const sections = await textSplitter.createDocuments([doc.text]);
            
            for (const section of sections) {
              const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: section.pageContent,
              });

              await supabase
                .from('page_sections')
                .insert({
                  document_id: doc.id,
                  context: section.pageContent,
                  token_count: section.pageContent.split(/\s+/).length,
                  embedding: embeddingResponse.data[0].embedding
                });
            }
          }
        } else {
          console.error('Error importing Notion documents:', data.error);
        }
      } catch (error) {
        console.error('Error importing Notion documents:', error);
      }
    }
  }, [notionConnected]);

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8 text-center text-blue-600">Settings</h1>
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
