"use client";

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, FileText, Calendar, Clock, Download, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabaseClient";
import styles from './TranscriptDetail.module.css';
import { Plus, Minus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenerativeAI } from "@google/generative-ai";

const BASE_URL_BACKEND = "https://api.amurex.ai"

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_GEMINI_API_KEY);

export default function TranscriptDetail({ params }) {
  // Initialize ldrs in a useEffect
  useEffect(() => {
    // Dynamically import ldrs only on the client side
    import('ldrs').then(({ ring }) => {
      ring.register();
    });
  }, []);

  const router = useRouter()
  const [memoryEnabled, setMemoryEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [transcript, setTranscript] = useState(null)
  const [fullTranscriptText, setFullTranscriptText] = useState('')
  const [error, setError] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [copyButtonText, setCopyButtonText] = useState("Copy share link");
  const [copyActionItemsText, setCopyActionItemsText] = useState("Copy");
  const [copyMeetingSummaryText, setCopyMeetingSummaryText] = useState("Copy");
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [sharedWith, setSharedWith] = useState([]);
  const [previewContent, setPreviewContent] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const messagesEndRef = useRef(null);
  


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

  const handleCopyLink = async () => {
    try {
      // Get the user's email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', session.user.id)
        .single();
      
      if (userError) throw userError;
      
      const userEmail = userData.email;
      const baseLink = `${window.location.host.includes('localhost') ? 'http://' : 'https://'}${window.location.host}/shared/${params.id}`;
      const shareText = baseLink;
      
      navigator.clipboard.writeText(shareText)
        .then(async () => {
          console.log('Link copied to clipboard');
          setCopyButtonText("Copied!"); // Change button text
          setTimeout(() => setCopyButtonText("Copy share link"), 3000); // Revert text after 3 seconds

          await logUserAction(session.user.id, 'web_share_url_copied');
        })
        .catch(err => {
          console.error('Failed to copy the URL: ', err);
        });
    } catch (error) {
      console.error('Error getting user email:', error);
    }
  };

  const handleDownload = async () => {
    if (transcript && transcript.content) {
      try {
        setIsLoadingPreview(true);
        setIsPreviewModalOpen(true);
        
        const response = await fetch(transcript.content);
        if (!response.ok) throw new Error('Network response was not ok');
  
        const text = await response.text();
        setPreviewContent(text);
        setIsLoadingPreview(false);
      } catch (error) {
        console.error('Error loading preview:', error);
        setIsLoadingPreview(false);
      }
    }
  };

  const handleActualDownload = async () => {
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
        setIsPreviewModalOpen(false);
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

      // Fetch full transcript text
      if (data.transcript) {
        const transcriptResponse = await fetch(data.transcript);
        const transcriptText = await transcriptResponse.text();
        setFullTranscriptText(transcriptText);
      }

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

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSending) return;

    const newMessage = {
      role: 'user',
      content: chatInput.trim()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chatMessages, newMessage],
          transcript: {
            summary: transcript.summary,
            actionItems: transcript.actionItems,
            fullTranscript: fullTranscriptText
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Create a temporary message for streaming
      const tempMessage = {
        role: 'assistant',
        content: ''
      };
      setChatMessages(prev => [...prev, tempMessage]);

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedContent += chunk;

        // Update the last message with accumulated content
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: accumulatedContent
          };
          return newMessages;
        });
      }

    } catch (error) {
      console.error('Error in chat:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="p-6 mx-auto">
          <div className="flex items-center justify-center h-screen">
            <l-ring
              size="55"
              stroke="5"
              bg-opacity="0"
              speed="2"
              color="white"
            ></l-ring>
          </div>
        </div>
      </div>
    )
  }

  if (error || !transcript) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <div className="p-6 mx-auto">
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
      <div className="min-h-screen bg-black">
        <div className="p-6 mx-auto">
          {/* Modal Component */}
          {isModalOpen && (
            <div 
              className="px-2 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={(e) => {
                // Close modal only if the background (not the modal content) is clicked
                if (e.target === e.currentTarget) {
                  toggleModal();
                }
              }}
            >
              <div className="bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20">
                <h2 className="lg:text-xl text-md font-medium mb-4 text-white">Share notes from <b>{transcript.title}</b></h2>
                
                {/* Email Input Section */}
                <div className="mt-4 hidden">
                  <p className="text-white lg:text-md text-sm font-semibold">Send via email</p>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={emailInput}
                      onChange={handleEmailInputChange}
                      onKeyDown={handleEmailInputKeyDown}
                      placeholder="Enter emails"
                      className="w-full mt-2 p-2 border rounded bg-transparent text-white text-sm lg:text-md"
                    />
                    <button
                      onClick={addEmail}
                      className="ml-2 mt-2 p-2 bg-[#9334E9] text-white rounded"
                    >
                      <Plus />
                    </button>
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
                      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/>
                      <path d="m21.854 2.147-10.94 10.939"/>
                    </svg>
                    <span>Send</span>
                  </button>

                  {sharedWith.length > 0 && (
                    <ul className="mt-4 text-white">
                      <li className="font-semibold lg:text-md text-sm">Already shared with</li>
                      {sharedWith.map((email, index) => (
                        <li key={index} className="lg:text-md text-sm bg-[#27272A] p-2 rounded mt-1 flex justify-between items-center w-min">
                          {email}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Horizontal Divider */}
                <div className="my-6 border-t border-white/20 hidden"></div>

                {/* Copy Link Section */}
                <div>
                  <p className="text-white lg:text-md text-sm font-semibold hidden">Or copy the invite URL</p>
                  <input
                    type="text"
                    value={`${window.location.host.includes('localhost') ? 'http://' : 'https://'}${window.location.host}/shared/${params.id}`}
                    readOnly
                    className="w-[30%] mt-2 px-4 py-2 border border-[#27272A] rounded-[8px] bg-transparent text-zinc-400 text-sm focus:outline-none"
                    onClick={(e) => e.target.select()}
                    style={{ 
                      userSelect: "none", 
                      outline: "none"
                    }}
                  />
                  <button 
                    className="mt-2 lg:px-4 lg:py-2 px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-xs font-normal border border-white/10 bg-[#3c1671] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                    onClick={handleCopyLink}
                  >
                    <svg width="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 4V7H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>{copyButtonText}</span>
                  </button>
                </div>

                {/* Horizontal Divider */}
                <div className="my-6 border-t border-white/10 hidden"></div>

                {/* Done Button */}
                <div className="flex justify-end">
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

          {/* Preview Modal Component */}
          {isPreviewModalOpen && (
            <div 
              className="px-2 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsPreviewModalOpen(false);
                }
              }}
            >
              <div className="bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20 w-[90%] max-w-4xl max-h-[80vh] flex flex-col">
                <h2 className="lg:text-xl text-md font-medium mb-4 text-white">Full transcript</h2>
                
                <div className="flex-grow overflow-auto bg-[#27272A] rounded-lg p-4 mb-4">
                  {isLoadingPreview ? (
                    <div className="flex items-center justify-center h-full">
                      <l-ring
                        size="40"
                        stroke="5"
                        bg-opacity="0"
                        speed="2"
                        color="white"
                      ></l-ring>
                    </div>
                  ) : (
                    <pre className="text-white whitespace-pre-wrap font-mono text-sm">
                      {previewContent}
                    </pre>
                  )}
                </div>



                <div className="flex justify-end gap-4">
                  <button 
                    className="mr-2 mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-normal border border-white/10 bg-transparent text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]"
                    onClick={() => setIsPreviewModalOpen(false)}
                  >
                    <span>Cancel</span>
                  </button>
                  <button 
                    className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-normal border border-white/10 bg-[#6D28D9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                    onClick={handleActualDownload}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 15V16C21 18.2091 19.2091 20 17 20H7C4.79086 20 3 18.2091 3 16V15M12 3V16M12 16L16 11M12 16L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Download</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Chat Sidebar */}
          <div 
            className={`fixed top-0 right-0 h-full w-[450px] bg-black border-l border-zinc-800 transform transition-transform duration-300 ease-in-out z-50 ${
              isChatOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <button
                  className="px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-normal border border-white/10 bg-zinc-900 text-white transition-all duration-200 hover:border-[#6D28D9]"
                  onClick={handleDownload}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>View transcript</span>
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-zinc-400 hover:bg-[#27272A] transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-poppins">
                <div 
                  className={`flex justify-start`}
                >
                  <div 
                    className={`max-w-[80%] rounded-3xl text-md text-white`}
                  >
                    Hey, I'm ready to help you with any questions you have about this meeting. What can I do for you?
                  </div>
                </div>

                {chatMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-3xl text-md ${
                        message.role === 'user' 
                          ? 'bg-[#6D28D9] text-white px-4 py-2'
                          : 'text-white'
                      }`}
                    >
                      {message.content}
                      {isSending && index === chatMessages.length - 1 && message.role === 'assistant' && (
                        <span className="inline-block animate-pulse">▋</span>
                      )}
                    </div>
                  </div>
                ))}
                {isSending && chatMessages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-3xl text-md text-white">
                      <span className="inline-block animate-pulse">▋</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>


              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="p-4 border-t border-zinc-800 mr-14">
                <div className="flex items-center w-full">
                  <div className="relative flex-1 flex items-center">
                    <div className="absolute left-3 md:left-4 text-zinc-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 p-3 md:p-4 pl-10 md:pl-12 text-md rounded-l-lg focus:outline-none bg-black border border-zinc-800 text-zinc-300 focus:border-[#6D28D9] transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isSending}
                    className={`p-3 md:p-4 rounded-r-lg bg-black border-t border-r border-b border-zinc-800 text-zinc-300 ${
                      !chatInput.trim() || isSending ? 'cursor-not-allowed' : 'hover:bg-[#3c1671]'
                    } transition-colors`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256" className="md:w-6 md:h-6">
                      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm45.66-93.66a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32-11.32L148.69,136H88a8,8,0,0,1,0-16h60.69l-18.35-18.34a8,8,0,0,1,11.32-11.32Z"></path>
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Main Content */}
          <div className={`transition-all duration-300 ${isChatOpen ? 'mr-[450px]' : ''}`}>
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
                  <div className="hidden items-center gap-2 border-r border-zinc-800 pr-4 hidden">
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

            <div className="bg-black rounded-xl border border-zinc-800">
              <div className="p-6 border-b border-zinc-800 hidden lg:block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="hidden text-[#6D28D9]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h1 className="text-2xl font-medium text-white">
                      {transcript.title}
                    </h1>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      className={`${isChatOpen ? 'hidden' : ''} bg-[#6D28D9] lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-lg text-md font-normal border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]`}
                      onClick={() => setIsChatOpen(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Chat with the meeting
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
                {transcript.actionItems && (
                  <div onClick={handleActionItemClick}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-[#6D28D9] font-normal mb-3 lg:text-xl text-md">Action Items</h2>
                    </div>

                    <div className="bg-black rounded-lg p-4 border border-zinc-800">
                      <div
                        className={`text-zinc-300 lg:text-base text-sm ${styles.notesContent}`}
                        style={{ whiteSpace: 'normal' }} // Ensure normal whitespace handling
                        dangerouslySetInnerHTML={{ __html: transcript.actionItems }}
                      />
                    </div>
                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(transcript.actionItems);
                          setCopyActionItemsText("Copied!");
                          setTimeout(() => setCopyActionItemsText("Copy"), 3000);
                        }}
                        className="mt-4 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 bg-zinc-900 text-white transition-all duration-200 hover:border-[#6D28D9]"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                          <path d="M16 4V7H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                          <path d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        <span className="text-sm">{copyActionItemsText}</span>
                      </button>
                  </div>
                )}

                {transcript.summary && (
                  <div onClick={handleSummaryClick}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-[#6D28D9] font-medium mb-3 lg:text-xl text-md">Meeting Summary</h2>
                    </div>

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

                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(transcript.summary);
                          setCopyMeetingSummaryText("Copied!");
                          setTimeout(() => setCopyMeetingSummaryText("Copy"), 3000);
                        }}
                        className="mt-4 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-medium border border-white/10 bg-zinc-900 text-white transition-all duration-200 hover:border-[#6D28D9]"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                          <path d="M16 4V7H19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                          <path d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        <span className="text-sm">{copyMeetingSummaryText}</span>
                      </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 