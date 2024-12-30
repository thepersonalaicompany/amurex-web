"use client";

import { useState, useEffect } from 'react'
import { ArrowLeft, Download, Share2, Clock, Calendar, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabaseClient"

export default function TranscriptDetail({ params }) {
  const router = useRouter()
  const [memoryEnabled, setMemoryEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [transcript, setTranscript] = useState(null)
  const [messages, setMessages] = useState([])

  useEffect(() => {
    fetchMemoryStatus()
    fetchTranscript()
  }, [])

  const fetchTranscript = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      const { data, error } = await supabase
        .from('late_meeting')
        .select(`
          id,
          meeting_id,
          transcript,
          summary,
          action_items,
          created_at,
          meeting_start_time
        `)
        .eq('id', params.id)
        .single()

      if (error) throw error

      if (data) {
        setTranscript({
          id: data.id,
          title: data.meeting_id || 'Untitled Meeting',
          date: new Date(data.created_at).toISOString().split('T')[0],
          time: new Date(data.meeting_start_time * 1000).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          summary: data.summary,
          action_items: data.action_items
        })
        
        if (data.transcript) {
          setMessages(data.transcript)
        }
      }
    } catch (error) {
      console.error('Error fetching transcript:', error)
    } finally {
      setLoading(false)
    }
  }

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
    }
  }

  if (loading || !transcript) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading transcript...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="sticky top-0 z-10 bg-black/50 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href="/transcripts" 
              className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Transcripts
            </Link>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Memory</span>
                <Switch 
                  checked={memoryEnabled}
                  disabled={true}
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Calendar className="h-4 w-4" />
                <span>{transcript.date}</span>
                <Clock className="h-4 w-4 ml-2" />
                <span>{transcript.time}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-zinc-400 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-zinc-400 hover:text-white"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <h1 className="text-2xl font-semibold text-white">{transcript.title}</h1>

          {transcript.summary && (
            <section>
              <h2 className="text-lg font-medium text-purple-400 mb-4">Summary</h2>
              <Card className="bg-zinc-900/50 border-zinc-800">
                <div className="p-4">
                  <p className="text-zinc-300">{transcript.summary}</p>
                </div>
              </Card>
            </section>
          )}

          {transcript.action_items && (
            <section>
              <h2 className="text-lg font-medium text-purple-400 mb-4">Action Items</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full transform scale-150 opacity-0 group-hover:opacity-100 transition-all"></div>
                    <CheckCircle2 className="h-5 w-5 text-purple-500" />
                  </div>
                  <span className="text-zinc-300">{transcript.action_items}</span>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-medium text-purple-400 mb-4">Transcripts</h2>
            <Card className="bg-zinc-900/50 border-zinc-800">
              <div className="p-4">
                <div className="text-zinc-300 whitespace-pre-line">
                  {messages}
                </div>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
} 