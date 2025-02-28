'use client';

export const dynamic = 'force-dynamic'

import { Suspense } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, FileText, Cloud, Github, Bug, LogOut, Video, Calendar } from 'lucide-react';
import Cookies from 'js-cookie';
import { X } from "@phosphor-icons/react";
import { Navbar } from '@/components/Navbar'
import { toast } from 'react-hot-toast';

const PROVIDER_ICONS = {
  google: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png",
  notion: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Notion-logo.svg/2048px-Notion-logo.svg.png"
};

function SettingsContent() {
  const [activeTab, setActiveTab] = useState('personalization');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [notionConnected, setNotionConnected] = useState(false);
  const [googleDocsConnected, setGoogleDocsConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [notionDocuments, setNotionDocuments] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSource, setImportSource] = useState('');
  const [importProgress, setImportProgress] = useState(0);
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [createdAt, setCreatedAt] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    checkIntegrations();
  }, []);

  useEffect(() => {
    const connection = searchParams.get('connection');
    const error = searchParams.get('error');

    if (connection === 'success') {
      toast.success('Google Docs connected successfully!');
    }
    if (error) {
      toast.error(`Connection failed: ${error}`);
    }
  }, [searchParams]);

  const checkIntegrations = async () => {
    try {
      console.log('checkIntegrations');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        const { data: user, error } = await supabase
          .from('users')
          .select('notion_connected, google_docs_connected, calendar_connected, memory_enabled, email, created_at')
          .eq('id', session.user.id)
          .single();
        console.log('user', user);

        if (user) {
          setUserEmail(user.email);
          setCreatedAt(new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }));
          setNotionConnected(user.notion_connected);
          setGoogleDocsConnected(user.google_docs_connected);
          setCalendarConnected(user.calendar_connected);
          setMemoryEnabled(user.memory_enabled);
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
      router.push('/web_app/signin');
    }
    
    setLoading(false);
  };

  const handleNotionConnect = async () => {
    console.log('Starting Notion connection flow...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch('/api/notion/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const data = await response.json();
        if (data.url) {
          console.log('Setting pendingNotionImport flag before OAuth redirect');
          localStorage.setItem('pendingNotionImport', 'true');
          router.push(data.url);
        } else {
          console.error('Error starting Notion OAuth flow:', data.error);
          toast.error('Failed to connect Notion');
        }
      }
    } catch (error) {
      console.error('Error connecting Notion:', error);
      toast.error('Failed to connect Notion');
    }
  };

  const handleGoogleDocsConnect = async () => {
    console.log('Starting Google Docs connection flow...');
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
          console.log('Setting pendingGoogleDocsImport flag before OAuth redirect');
          localStorage.setItem('pendingGoogleDocsImport', 'true');
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
      console.log('Starting Google Docs import process...');
      setIsImporting(true);
      setImportSource('Google Docs');
      
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      try {
        const response = await fetch('/api/google/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ 
            userId: session.user.id,
            accessToken: accessToken
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('Google Docs import initiated:', data);
          toast.success('Import complete! Check your email for details.');
        } else {
          console.error('Error importing Google docs:', data.error);
          toast.error('Import failed. Please try again.');
        }
      } catch (error) {
        console.error('Error importing Google docs:', error);
        toast.error('Import failed. Please try again.');
      } finally {
        console.log('Import process completed');
        setIsImporting(false);
        setImportSource('');
        setImportProgress(0);
      }
    }
  }, [googleDocsConnected]);

  // Update the useEffect to check for pending imports as well
  useEffect(() => {
    const checkPendingImports = async () => {
      console.log('Checking for pending imports...');
      const pendingGoogleImport = localStorage.getItem('pendingGoogleDocsImport');
      const pendingNotionImport = localStorage.getItem('pendingNotionImport');
      
      if (pendingGoogleImport === 'true' && googleDocsConnected) {
        console.log('Found pending Google import, starting Google Docs import...');
        localStorage.removeItem('pendingGoogleDocsImport');
        await importGoogleDocs();
      }

      if (pendingNotionImport === 'true' && notionConnected) {
        console.log('Found pending Notion import, starting Notion import...');
        localStorage.removeItem('pendingNotionImport');
        await importNotionDocuments();
      }
    };

    checkPendingImports();
  }, [googleDocsConnected, notionConnected, importGoogleDocs, importNotionDocuments]);

  const handleMemoryToggle = async (checked) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from('users')
          .update({ memory_enabled: checked })
          .eq('id', session.user.id);

        if (error) throw error;
        setMemoryEnabled(checked);
      }
    } catch (error) {
      console.error('Error updating memory settings:', error);
    }
  };

  const handleGoogleCallback = useCallback(async () => {
    console.log('Handling Google callback');
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (code) {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        // Exchange code for tokens
        const response = await fetch('/api/google/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            code,
            state,
            userId: session?.user?.id 
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          await checkIntegrations(); // Refresh integration status
          toast.success('Google Docs connected successfully!');
          
          // Trigger import if there's a pending import flag
          const pendingImport = localStorage.getItem('pendingGoogleDocsImport');
          if (pendingImport === 'true') {
            console.log('Starting import after successful connection...');
            localStorage.removeItem('pendingGoogleDocsImport');
            await importGoogleDocs();
          }
        } else {
          console.error('Connection failed:', data.error);
          toast.error('Failed to connect Google Docs');
        }
      } catch (err) {
        console.error('Error in Google callback:', err);
        toast.error('Failed to connect Google Docs');
      }
    }
    
    if (error) {
      toast.error(`Connection failed: ${error}`);
    }
  }, [searchParams, importGoogleDocs, checkIntegrations]);

  // Update the useEffect to run handleGoogleCallback when code is present
  useEffect(() => {
    if (searchParams.get('code')) {
      handleGoogleCallback();
    }
  }, [searchParams, handleGoogleCallback]);

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Left App Navbar - the thin one */}
      <div className="w-16 flex-shrink-0 bg-black border-r border-zinc-800">
        <Navbar />
      </div>
      
      {/* Main Settings Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-64 flex-shrink-0 bg-black p-4 border-r border-zinc-800 overflow-y-auto">
          <h2 className="text-2xl font-medium text-white mb-6">Settings</h2>
          <div className="text-md space-y-2">
            <button
              onClick={() => setActiveTab('personalization')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'personalization' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Personalization
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'account' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === 'feedback' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              Feedback
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-black overflow-y-auto">
          {activeTab === 'personalization' && (
            <div className="space-y-8">
              <h1 className="text-2xl font-medium text-white">Personalization</h1>
              
              {/* Memory Toggle */}
              <Card className="bg-black border-zinc-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                        <Cloud className="w-5 h-5 text-[#9334E9]" />
                        Memory
                      </h2>
                      <p className="text-sm text-zinc-400">Keep your notes synced across devices</p>
                    </div>
                    <Switch 
                      checked={memoryEnabled}
                      onCheckedChange={handleMemoryToggle}
                      className={memoryEnabled ? 'bg-[#9334E9]' : ''}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Integrations */}
              <div className="space-y-4">
                <Card className="bg-black border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src={PROVIDER_ICONS.notion} 
                          alt="Notion" 
                          className="w-6 h-6"
                        />
                        <div>
                          <h3 className="font-medium text-white text-lg">Connect Notion</h3>
                          <p className="text-sm text-zinc-400">Sync your Notion pages</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className={`bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 ${
                          notionConnected ? 'bg-green-900 hover:bg-green-800' : ''
                        } min-w-[100px]`}
                        onClick={handleNotionConnect}
                        disabled={isImporting && importSource === 'Notion'}
                      >
                        {isImporting && importSource === 'Notion' ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9334E9] mr-2"></div>
                            Importing...
                          </div>
                        ) : notionConnected ? 'Connected' : 'Connect'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img 
                          src={PROVIDER_ICONS.google} 
                          alt="Google" 
                          className="w-6 h-6"
                        />
                        <div>
                          <h3 className="font-medium text-white text-lg">Connect Google</h3>
                          <p className="text-sm text-zinc-400">Sync your Google documents</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className={`bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 ${
                          googleDocsConnected ? 'bg-green-900 hover:bg-green-800' : ''
                        } min-w-[100px]`}
                        onClick={handleGoogleDocsConnect}
                        disabled={isImporting && importSource === 'Google Docs'}
                      >
                        {isImporting && importSource === 'Google Docs' ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9334E9] mr-2"></div>
                            Importing...
                          </div>
                        ) : googleDocsConnected ? 'Connected' : 'Connect'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black border-zinc-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#9334E9]/20 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#9334E9]/30 via-[#9334E9]/20 to-[#9334E9]/30"></div>
                  <CardContent className="p-4 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <MessageSquare className="w-6 h-6 text-[#9334E9]" />
                        <div>
                          <h3 className="font-medium text-white text-lg">Knowledge Search</h3>
                          <p className="text-sm text-zinc-400">Try our new semantic search feature</p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9334E9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
                        <Button 
                          variant="outline" 
                          className="relative bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:border-[#9334E9] border border-zinc-800 rounded-md backdrop-blur-sm transition-colors duration-200"
                          onClick={() => router.push('/chat')}
                        >
                          Try Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <>
              <div className="flex-1 space-y-8">
                <h1 className="text-2xl font-medium text-white">Account</h1>
                
                <Card className="bg-black border-zinc-800">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-md text-zinc-400">Email</h3>
                        <p className="text-white">{userEmail}</p>
                      </div>
                      <div>
                        <h3 className="text-md text-zinc-400">With us since</h3>
                        <p className="text-white">{createdAt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Button 
                  variant="outline" 
                  className="text-sm bg-zinc-800 hover:bg-red-500 text-white whitespace-nowrap flex items-center mt-auto w-fit"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 text-red-500 mr-2" />
                  Sign out
                </Button>
              </div>
            </>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-10">
              <h1 className="text-2xl font-medium text-white">Feedback</h1>
              
              <Card className="bg-black border-zinc-800">
                <CardContent className="p-6">
                  {/* Report an issue */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-md font-semibold flex items-center gap-2 text-white">
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
                        <Github className="w-5 h-5 text-[#9334E9] mr-2" />
                        Report Issue
                      </Button>
                    </div>
                    
                    {/* Book a call */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-md font-semibold flex items-center gap-2 text-white">
                          Want to give us feedback?
                        </h2>
                        <p className="text-sm text-zinc-400">
                          Book a call with us to talk about your experience
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="bg-zinc-800 hover:bg-zinc-700 text-white whitespace-nowrap flex items-center"
                        onClick={() => window.open('https://cal.com/founders-the-personal-ai-company/15min', '_blank')}
                      >
                        <Calendar className="w-5 h-5 text-[#9334E9] mr-2" />
                        Book a call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
