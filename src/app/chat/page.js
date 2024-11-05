"use client";
// 1. Import required dependencies
import React, { useEffect, useRef, useState, memo } from "react";
import { ArrowCircleRight, ChatCenteredDots, Stack, GitBranch } from "@phosphor-icons/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from '@/lib/supabaseClient';
// 3. Home component
export default function AISearch() {
// 4. Initialize states and refs
  const messagesEndRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const [internetSearchEnabled, setInternetSearchEnabled] = useState(false);
  const [session, setSession] = useState(null);

  // Auto scroll to the end of the messages
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [messageHistory]);

  // Add session check on component mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Update message history fetch with user_id
  useEffect(() => {
    if (!session?.user?.id) return;

    const handleInserts = (payload) => {
      if (payload.new.user_id !== session.user.id) return;
      
      setMessageHistory((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        const isSameType = lastMessage?.payload?.type === "GPT" && payload.new.payload.type === "GPT";
        return isSameType ? [...prevMessages.slice(0, -1), payload.new] : [...prevMessages, payload.new];
      });
    };

    supabase
      .channel("message_history")
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "message_history",
          filter: `user_id=eq.${session.user.id}`
        },
        handleInserts
      )
      .subscribe();

    supabase
      .from("message_history")
      .select("*")
      .eq('user_id', session.user.id)
      .order("created_at", { ascending: true })
      .then(({ data: message_history, error }) =>
        error ? console.log("error", error) : setMessageHistory(message_history)
      );
  }, [session?.user?.id]);

  // Update sendMessage to include user_id
  const sendMessage = (messageToSend) => {
    if (!session?.user?.id) return;
    
    const message = messageToSend || inputValue;
    const body = JSON.stringify({ 
      message, 
      internetSearchEnabled,
      user_id: session.user.id 
    });
    setInputValue("");
    fetch("/api/chat", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("data", data);
      })
      .catch((err) => console.log("err", err));
  };
// 12. Render home component
  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--surface-color-2)" }}>
      <div className="flex-grow h-screen flex flex-col">
        {messageHistory.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <h1 
              className="text-6xl mb-8 font-serif"
              style={{ 
                fontFamily: "var(--font-louize), serif",
                color: "var(--color)"
              }}
            >
              Search Anything
            </h1>
            <div className="w-full max-w-2xl">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setInternetSearchEnabled(!internetSearchEnabled)}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                    internetSearchEnabled 
                      ? 'bg-opacity-10 text-blue-600 bg-blue-600'
                      : 'bg-opacity-10 text-gray-600 bg-gray-600'
                  }`}
                  style={{ borderColor: "var(--line-color)" }}
                >
                  {internetSearchEnabled ? 'Internet Search Enabled' : 'Search Local Documents Only'}
                </button>
                <InputArea 
                  inputValue={inputValue} 
                  setInputValue={setInputValue} 
                  sendMessage={sendMessage}
                  className="scale-110"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-grow h-screen flex flex-col justify-between mx-auto max-w-4xl">
            {messageHistory.map((message, index) => (
              <MessageHandler key={index} message={message.payload} sendMessage={sendMessage} />
            ))}
            <div className="sticky bottom-0 bg-opacity-80 backdrop-blur-sm p-4" style={{ backgroundColor: "var(--surface-color-2)" }}>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setInternetSearchEnabled(!internetSearchEnabled)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    internetSearchEnabled 
                      ? 'bg-opacity-10 text-blue-600 bg-blue-600'
                      : 'bg-opacity-10 text-gray-600 bg-gray-600'
                  }`}
                >
                  {internetSearchEnabled ? 'Internet Search Enabled' : 'Search Local Documents Only'}
                </button>
                <InputArea inputValue={inputValue} setInputValue={setInputValue} sendMessage={sendMessage} />
              </div>
            </div>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
/* 17. Export InputArea component */
export function InputArea({ inputValue, setInputValue, sendMessage, className = '' }) {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="text"
        placeholder="Type your search..."
        className="flex-1 p-4 rounded-l-lg focus:outline-none transition-colors"
        style={{ 
          backgroundColor: "var(--surface-color)",
          borderColor: "var(--line-color)",
          color: "var(--color)"
        }}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button 
        onClick={() => sendMessage()} 
        className="p-4 rounded-r-lg transition-colors hover:bg-opacity-80"
        style={{ 
          backgroundColor: "var(--surface-color)",
          color: "var(--color)"
        }}
      >
        <ArrowCircleRight size={25} />
      </button>
    </div>
  );
}
/* 21. Query component for displaying content */
export const Query = ({ content = '' }) => {
  return <div className="text-3xl font-bold my-4 w-full">{content}</div>;
};
/* 22. Sources component for displaying list of sources */
export const Sources = ({ content = [] }) => {
  // 23. Truncate text to a given length
  const truncateText = (text = '', maxLength = 40) => {
    if (!text) return '';
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  };

  // 24. Extract site name from a URL
  const extractSiteName = (url) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch (error) {
      return '';
    }
  };

  return (
    <>
      <div className="text-3xl font-bold my-4 w-full flex">
        <GitBranch size={32} />
        <span className="px-2">Sources</span>
      </div>
      <div className="flex flex-wrap">
        {Array.isArray(content) && content.map(({ title = '', link = '' }, index) => (
          <a key={index} href={link} className="w-1/4 p-1">
            <span className="flex flex-col items-center py-2 px-6 bg-white rounded shadow hover:shadow-lg transition-shadow duration-300 tile-animation h-full">
              <span>{truncateText(title, 40)}</span>
              <span>{extractSiteName(link)}</span>
            </span>
          </a>
        ))}
      </div>
    </>
  );
};
// 27. VectorCreation component for displaying a brief message
export const VectorCreation = ({ content = '' }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return visible ? (
    <div className="w-full p-1">
      <span className="flex flex-col items-center py-2 px-6 bg-white rounded shadow hover:shadow-lg transition-shadow duration-300 h-full tile-animation">
        <span>{content}</span>
      </span>
    </div>
  ) : null;
};
// 28. Heading component for displaying various headings
export const Heading = ({ content = '' }) => {
  return (
    <div className="text-3xl font-bold my-4 w-full flex">
      <ChatCenteredDots size={32} />
      <span className="px-2">{content}</span>
    </div>
  );
};
// 30. GPT component for rendering markdown content
const GPT = ({ content = '' }) => (
  <ReactMarkdown
    className="prose mt-1 w-full break-words prose-p:leading-relaxed"
    remarkPlugins={[remarkGfm]}
    components={{
      a: ({ node, ...props }) => <a {...props} style={{ color: "blue", fontWeight: "bold" }} />,
    }}
  >
    {content}
  </ReactMarkdown>
);
// 31. FollowUp component for displaying follow-up options
export const FollowUp = ({ content = '', sendMessage = () => {} }) => {
  const [followUp, setFollowUp] = useState([]);
  const messagesEndReff = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      messagesEndReff.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [followUp]);

  useEffect(() => {
    if (typeof content === 'string' && content[0] === "{" && content[content.length - 1] === "}") {
      try {
        const parsed = JSON.parse(content);
        setFollowUp(Array.isArray(parsed.follow_up) ? parsed.follow_up : []);
      } catch (error) {
        console.log("error parsing json", error);
        setFollowUp([]);
      }
    }
  }, [content]);

  const handleFollowUpClick = (text, e) => {
    e.preventDefault();
    if (text) sendMessage(text);
  };

  return (
    <>
      {followUp.length > 0 && (
        <div className="text-3xl font-bold my-4 w-full flex">
          <Stack size={32} /> <span className="px-2">Follow-Up</span>
        </div>
      )}
      {followUp.map((text, index) => (
        <a 
          href="#" 
          key={index} 
          className="text-xl w-full p-1" 
          onClick={(e) => handleFollowUpClick(text, e)}
        >
          <span>{text || ''}</span>
        </a>
      ))}
      <div ref={messagesEndReff} />
    </>
  );
};
// 40. MessageHandler component for dynamically rendering message components
const MessageHandler = memo(({ message = { type: '', content: '' }, sendMessage = () => {} }) => {
  const COMPONENT_MAP = {
    Query,
    Sources,
    VectorCreation,
    Heading,
    GPT,
    FollowUp,
  };
  
  const Component = COMPONENT_MAP[message.type];
  return Component ? <Component content={message.content} sendMessage={sendMessage} /> : null;
});

// Add this line after the component definition
MessageHandler.displayName = 'MessageHandler';