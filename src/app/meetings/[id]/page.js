"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Calendar, Clock, Download, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabaseClient";
import styles from './TranscriptDetail.module.css';
import { Plus, Minus } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import ReactMarkdown from 'react-markdown';


const BASE_URL_BACKEND = "https://api.amurex.ai"


export default function TranscriptDetail({ params }) {
  const router = useRouter()
  const [memoryEnabled, setMemoryEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [transcript, setTranscript] = useState(null)
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copyButtonText, setCopyButtonText] = useState("Copy URL");
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);

  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/web_app/signin');
        return;
      }
      setSession(session);
    };

    fetchSession();
  }, [router]);

  const logUserAction = async (userId, eventType) => {
    fetch(`${BASE_URL_BACKEND}/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ 
        uuid: userId, 
        event_type: eventType,
        meeting_id: params.id
      }),
    }).catch(error => {
      console.error("Error tracking:", error);
    });
  };

  useEffect(() => {
    fetchMemoryStatus()
    fetchTranscript()
  }, [params.id])

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  useEffect(() => {
    // Check if the device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleEmailInputKeyDown = (e) => {
    if (e.key === 'Enter' && emailInput.trim()) {
      if (validateEmail(emailInput.trim())) {
        addEmail();
      } else {
        console.error('Invalid email address');
        // Optionally, you can set an error state to display a message to the user
      }
    }
  };
  
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailInputChange = (e) => {
    setEmailInput(e.target.value);
  };

  const addEmail = () => {
    if (emailInput.trim()) {
      setEmails([...emails, emailInput.trim()]);
      setEmailInput("");
    }
  };

  const removeEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const sendEmails = async () => {
    const shareUrl = `${window.location.host}/shared/${params.id}`;
    let owner_email = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/web_app/signin');
        return;
      }

      // Fetch the owner's email
      const { data: userData, error: userError } = await supabase
        .from('users') // Replace 'users' with your actual table name
        .select('email')
        .eq('id', session.user.id)
        .single();

      if (userError) throw userError;
      owner_email = userData.email;
      console.log(owner_email);

      // Send each email to the external API
      for (const email of emails) {
        const response = await fetch(`${BASE_URL_BACKEND}/send_user_email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'meeting_share',
            owner_email: owner_email,
            email: email,
            share_url: shareUrl,
            meeting_id: params.id
          }),
        });

        await logUserAction(session.user.id, 'web_share_notes_via_email');

        if (!response.ok) {
          throw new Error(`Failed to send email to ${email}`);
        }
      }

      // Refresh the sharedWith list
      await fetchTranscript();

      // Clear the new emails list
      setEmails([]);

      // Ensure the modal remains open
      setIsModalOpen(true);

    } catch (error) {
      console.error('Error sending emails:', error);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.host}/shared/${params.id}`;
    navigator.clipboard.writeText(link)
      .then(async () => {
        console.log('Link copied to clipboard');
        setCopyButtonText("Copied!"); // Change button text
        setTimeout(() => setCopyButtonText("Copy URL"), 3000); // Revert text after 3 seconds

        await logUserAction(session.user.id, 'web_share_url_copied');
      })
      .catch(err => {
        console.error('Failed to copy the URL: ', err);
      });
  };

  const handleDownload = async () => {
    if (transcript && transcript.content) {
      try {
        const response = await fetch(transcript.content);
        if (!response.ok) throw new Error('Network response was not ok');
  
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
  
        // Preprocess the meeting title for the file name
        const fileName = transcript.title
          .toLowerCase()
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .replace(/[^\w_]/g, ''); // Remove special characters
  
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.txt`; // Use the processed title as the file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        await logUserAction(session.user.id, 'web_download_transcript');
      } catch (error) {
        console.error('Error downloading the file:', error);
      }
    }
  };

  const handleActionItemClick = () => {
    logUserAction(session.user.id, 'web_action_items_clicked');
  };

  const handleSummaryClick = () => {
    logUserAction(session.user.id, 'web_summary_clicked');
  };

  const fetchTranscript = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/web_app/signin')
        return
      }

      const { data, error } = await supabase
        .from('late_meeting')
        .select(`
          id,
          meeting_id,
          user_ids,
          created_at,
          meeting_title,
          summary,
          transcript,
          action_items,
          shared_with
        `)
        .eq('id', params.id)
        .contains('user_ids', [session.user.id])
        .single()

      if (error) throw error

      setTranscript({
        id: data.id,
        meeting_id: data.meeting_id,
        title: data.meeting_title || "Untitled Meeting",
        date: new Date(data.created_at).toLocaleDateString(),
        time: new Date(data.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit'
        }),
        summary: data.summary,
        content: data.transcript || "",
        actionItems: data.action_items || ""
      })

      setSharedWith(data.shared_with || []);
    } catch (err) {
      console.error('Error fetching transcript:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchMemoryStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/web_app/signin')
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('memory_enabled')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      setMemoryEnabled(data?.memory_enabled || false)
    } catch (error) {
      console.error('Error fetching memory status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Loading...</h1>
        </div>
      </div>
    )
  }

  if (error || !transcript) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="bg-[#1C1C1E] rounded-lg p-6">
            <h1 className="text-red-500 text-xl mb-4">
              {error || "Transcript not found"}
            </h1>
            <Link 
              href="/meetings"
              className="text-[#9334E9] hover:text-purple-300 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Meetings
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black lg:ml-[4rem]">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Modal Component */}
          {isModalOpen && (
            <div className="px-2 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20">
                <h2 className="lg:text-xl text-md font-medium mb-4 text-white">Share notes from <b>{transcript.title}</b></h2>
                {/* New Email Input */}
                <div className="mt-4">
                  <p className="text-white lg:text-md text-sm font-semibold">Send via email</p>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={emailInput}
                      onChange={handleEmailInputChange}
                      onKeyDown={isMobile ? undefined : handleEmailInputKeyDown}
                      placeholder={isMobile ? "Enter emails" : "Enter emails and press enter"}
                      className="w-full mt-2 p-2 border rounded bg-transparent text-white text-sm lg:text-md"
                    />
                    {isMobile && (
                      <button
                        onClick={addEmail}
                        className="ml-2 mt-2 p-2 bg-[#9334E9] text-white rounded"
                      >
                        <Plus />
                      </button>
                    )}
                  </div>
                  
                  {emails.length > 0 && (
                    <ul className="mt-2 text-white">
                      <li className="font-semibold lg:text-md text-sm">New recipients</li>
                      {emails.map((email, index) => (
                        <li key={index} className="lg:text-md text-sm bg-[#27272A] p-2 rounded mt-1 flex justify-between items-center w-min">
                          {email}
                          <button
                            onClick={() => removeEmail(index)}
                            className="ml-2 p-1 bg-[#9334E9] text-white rounded"
                          >
                            <Minus />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button 
                    className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                    onClick={sendEmails}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-send">
                      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/>
                      <path d="m21.854 2.147-10.94 10.939"/>
                    </svg>
                    <span>Send</span>
                  </button>

                  <ul className="mt-4 text-white">
                    <li className="font-semibold lg:text-md text-sm">Already shared with</li>
                    {sharedWith.map((email, index) => (
                      <li key={index} className="lg:text-md text-sm bg-[#27272A] p-2 rounded mt-1 flex justify-between items-center w-min">
                        {email}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                    <p className="text-white lg:text-md text-sm font-semibold">Or copy the invite URL</p>
                    <input
                      type="text"
                      value={`${window.location.host}/shared/${params.id}`}
                      readOnly
                      className="w-full mt-2 p-2 border rounded bg-transparent text-white lg:text-md text-sm"
                    />
                    <button 
                      className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                      onClick={handleCopyLink}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16 4V7H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{copyButtonText}</span>
                    </button>
                </div>

                <div className="flex justify-end mt-6">
                  <button 
                    className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-md font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                    onClick={toggleModal}
                  >
                    <span>Done</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/meetings"
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 lg:text-base text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Meetings
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-zinc-400 text-sm">
                <div className="items-center gap-2 border-r border-zinc-800 pr-4 hidden lg:flex">
                  <span className="text-zinc-400">Memory</span>
                  <Switch 
                    checked={memoryEnabled}
                    disabled={true}
                    className="data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-zinc-700"
                    aria-label="Toggle memory"
                  />
                </div>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {transcript.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {transcript.time}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#09090A] rounded-lg border border-zinc-800">
            <div className="p-6 border-b border-zinc-800 hidden lg:block">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-[#9334E9]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h1 className="text-2xl font-medium text-white">
                    {transcript.title}
                  </h1>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-md font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                    onClick={toggleModal}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" strokeLinejoin="round">
                      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/>
                      <polyline points="16 6 12 2 8 6"/>
                      <line x1="12" y1="2" x2="12" y2="15"/>
                    </svg>
                    <span>Share link</span>
                  </button>

                  <button 
                    className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-md font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                    onClick={handleDownload}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V16C21 18.2091 19.2091 20 17 20H7C4.79086 20 3 18.2091 3 16V15M12 3V16M12 16L16 11M12 16L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Download transcript</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile layout */}
            <div className="p-6 border-b border-zinc-800 lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-[#9334E9]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h1 className="text-md font-medium text-white">
                    {transcript.title}
                  </h1>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button 
                  className="px-2 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                  onClick={toggleModal}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" strokeLinejoin="round">
                    <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  <span>Share link</span>
                </button>

                <button 
                  className="px-2 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-sm font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                  onClick={handleDownload}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V16C21 18.2091 19.2091 20 17 20H7C4.79086 20 3 18.2091 3 16V15M12 3V16M12 16L16 11M12 16L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Download transcript</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* {transcript.summary && (
                <div className="bg-[#27272A] rounded-lg p-4">
                  <h2 className="text-purple-400 font-medium mb-2">Summary</h2>
                  <p className="text-zinc-300">{transcript.summary}</p>
                  
                </div>
              )} */}

              {transcript.actionItems && (
                <div onClick={handleActionItemClick}>
                  <h2 className="text-[#9334E9] font-medium mb-3 lg:text-xl text-md">Action Items</h2>
                  <div className="bg-black rounded-lg p-4 border border-zinc-800">
                    <div
                      className={`text-zinc-300 lg:text-base text-sm ${styles.notesContent}`}
                      style={{ whiteSpace: 'normal' }} // Ensure normal whitespace handling
                      dangerouslySetInnerHTML={{ __html: transcript.actionItems }}
                    />
                  </div>
                </div>
              )}

              {transcript.summary && (
                <div onClick={handleSummaryClick}>
                  <h2 className="text-[#9334E9] font-medium mb-3 lg:text-xl text-md">Meeting Summary</h2>
                  <div className="bg-black rounded-lg p-4 border border-zinc-800">
                    <div className="prose text-zinc-300 lg:text-base text-sm bg-default markdown-body">
                      {transcript.summary ? (
                        <ReactMarkdown
                          components={{
                            h3: ({ node, ...props }) => <h3 className="mb-1 text-lg font-bold" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                            li: ({ node, ...props }) => <li className="mb-1 ml-4" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                          }}
                        >
                          {transcript.summary}
                        </ReactMarkdown>
                      ) : (
                        "No meeting notes available."
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 