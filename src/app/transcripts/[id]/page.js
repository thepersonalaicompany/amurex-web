"use client";

import { useState, useEffect } from 'react'
import { ArrowLeft, FileText, Calendar, Clock, Download, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabaseClient"

const messages = [
  {
    role: "user",
    content: "Can you summarize the key points from today's meeting?"
  },
  {
    role: "assistant",
    content: "Here are the main points discussed:\n\n1. Q4 revenue targets exceeded by 15%\n2. New product launch scheduled for March\n3. Team expansion plans approved\n4. Customer satisfaction scores improved by 20%"
  },
  {
    role: "user",
    content: "What were the specific revenue numbers?"
  },
  {
    role: "assistant",
    content: "The Q4 revenue was $2.8M, compared to the target of $2.4M. This represents a 15% increase over the projected numbers and a 25% year-over-year growth."
  }
]

export default function TranscriptDetail({ params }) {
  const router = useRouter()
  const [memoryEnabled, setMemoryEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemoryStatus()
  }, [])

  const fetchMemoryStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
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

  const transcript = {
    id: params.id,
    title: "Team Meeting - Q4 Goals Review",
    date: "2024-12-24",
    time: "10:00 AM",
    duration: "1h 30m",
    summary: "Quarterly review meeting discussing Q4 performance, upcoming product launch, team growth, and customer satisfaction improvements. Key achievements include exceeding revenue targets and improved customer metrics."
  }

  return (
    <div className="min-h-screen bg-[#09090B]">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link 
            href="/transcripts"
            className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transcripts
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-zinc-400 text-sm">
              <div className="flex items-center gap-2 border-r border-zinc-800 pr-4">
                <span className="text-zinc-400">Memory</span>
                <Switch 
                  checked={memoryEnabled}
                  disabled={true}
                  className="data-[state=checked]:bg-purple-500"
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
            <div className="flex items-center gap-2 ml-4">
              <button className="p-2 text-zinc-400 hover:text-purple-400 transition-colors">
                <Download className="h-4 w-4" />
              </button>
              <button className="p-2 text-zinc-400 hover:text-purple-400 transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#09090B] rounded-lg">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="text-purple-400">
                <FileText className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                {transcript.title}
              </h1>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {transcript.summary && (
              <div className="bg-[#27272A] rounded-lg p-4">
                <h2 className="text-purple-400 font-medium mb-2">Summary</h2>
                <p className="text-zinc-300">{transcript.summary}</p>
              </div>
            )}

            <div>
              <h2 className="text-purple-400 font-medium mb-3">Action Items</h2>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  Schedule product launch planning meeting
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  Review team expansion budget
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  Prepare Q1 2025 targets
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-purple-400 font-medium mb-3">Meeting Notes</h2>
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.role === "user" 
                        ? "bg-[#27272A]" 
                        : "bg-[#2D2D3D]"
                    }`}
                  >
                    <p className={`text-sm mb-2 ${
                      message.role === "user" 
                        ? "text-zinc-400"
                        : "text-purple-400"
                    }`}>
                      {message.role === "user" ? "You" : "Assistant"}
                    </p>
                    <p className="text-zinc-200 whitespace-pre-line">{message.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 