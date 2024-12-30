"use client";

import { useState, useEffect } from 'react'
import { FileText, Search, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function TranscriptList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [transcripts, setTranscripts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTranscripts()
  }, [])

  const fetchTranscripts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const user_id = session.user.id;
      console.log("This is the user id", user_id)

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
        .contains('user_ids', [user_id])
        .order('created_at', { ascending: false })
        .not('transcript', 'is', null)

      if (error) throw error
      console.log("This is the data", data)

      const formattedTranscripts = data.map(meeting => ({
        id: meeting.id,
        title: meeting.meeting_id || 'Untitled Meeting',
        date: new Date(meeting.created_at).toISOString().split('T')[0],
        time: new Date(meeting.meeting_start_time * 1000).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        summary: meeting.summary,
        transcript: meeting.transcript,
        action_items: meeting.action_items
      }))

      setTranscripts(formattedTranscripts)
    } catch (error) {
      console.error('Error fetching transcripts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTranscripts = transcripts.filter(transcript =>
    transcript.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading transcripts...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-white">Transcripts</h1>
        
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder="Search transcripts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1C1C1E] text-white placeholder-zinc-400 rounded-lg px-10 py-3 border-0 focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTranscripts.map((transcript) => (
            <Link key={transcript.id} href={`/transcripts/${transcript.id}`}>
              <div className="bg-[#1C1C1E] hover:bg-[#27272A] transition-colors rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-purple-500">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-white font-semibold mb-2">{transcript.title}</h2>
                    <div className="flex items-center text-zinc-400 text-sm gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{transcript.date}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center text-zinc-400 text-sm gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{transcript.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredTranscripts.length === 0 && (
          <div className="text-center text-zinc-400 mt-8">
            <p>No transcripts found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
} 