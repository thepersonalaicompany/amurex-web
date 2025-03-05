"use client";

import { useState, useEffect } from 'react'
import { FileText, Search, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'

export default function TranscriptList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [transcripts, setTranscripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('personal')
  const router = useRouter()
  const [userTeams, setUserTeams] = useState([])

  useEffect(() => {
    fetchTranscripts()
    fetchUserTeams()
  }, [filter])

  const fetchTranscripts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/web_app/signin')
        return
      }

      if (filter !== 'personal') {
        // Get meetings for specific team
        const { data: teamMeetings, error: meetingsError } = await supabase
          .from('meetings_teams')
          .select(`
            meeting_id,
            team_id
          `)
          .eq('team_id', filter) // Filter by specific team_id

        if (meetingsError) throw meetingsError
        if (!teamMeetings?.length) {
          setTranscripts([])
          setLoading(false)
          return
        }

        // 2. Then get all meetings for those teams
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
            action_items
          `)
          .in('id', teamMeetings.map(meeting => meeting.meeting_id))
          .order('created_at', { ascending: false })
          .not('transcript', 'is', null)

        if (error) throw error
        
        // Match meetings with their team information
        const meetingsWithTeams = data.map(meeting => {
          const teamMeeting = teamMeetings.find(tm => tm.meeting_id === meeting.id)
          const teamInfo = userTeams.find(ut => ut.team_id === teamMeeting?.team_id)
          return {
            ...meeting,
            team_name: teamInfo?.teams?.team_name || 'Unknown Team'
          }
        })

        setTranscripts(formatTranscripts(meetingsWithTeams))
      } else {
        // Personal meetings query
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
            action_items
          `)
          .contains('user_ids', [session.user.id])
          .order('created_at', { ascending: false })
          .not('transcript', 'is', null)

        if (error) throw error
        setTranscripts(formatTranscripts(data))
      }
    } catch (err) {
      console.error('Error fetching transcripts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserTeams = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams (
            id,
            team_name
          )
        `)
        .eq('user_id', session.user.id)

      if (error) throw error
      setUserTeams(data || [])
    } catch (err) {
      console.error('Error fetching teams:', err)
    }
  }

  const formatTranscripts = (data) => {
    return data.map(meeting => ({
      id: meeting.id,
      meeting_id: meeting.meeting_id,
      title: meeting.meeting_title || "Untitled Meeting",
      date: new Date(meeting.created_at).toLocaleDateString(),
      time: new Date(meeting.created_at).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit'
      }),
      summary: meeting.summary,
      transcript: meeting.transcript,
      action_items: meeting.action_items,
      team_name: meeting.team_name
    }))
  }

  const filteredTranscripts = transcripts.filter(transcript =>
    transcript.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-white">Loading...</h1>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black">
        <div className="p-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6 text-white">Meetings</h1>
          
          <div className="flex items-center gap-2 mb-6 flex-wrap bg-[#1C1C1E] p-1 rounded-lg w-fit">
            <label className={`relative px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
              filter === 'personal' 
                ? 'bg-[#9334E9] text-[#FAFAFA] hover:cursor-not-allowed' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}>
              <input
                type="radio"
                value="personal"
                checked={filter === 'personal'}
                onChange={(e) => setFilter(e.target.value)}
                className="absolute opacity-0"
              />
              <span className="text-sm font-medium">Personal</span>
            </label>
            {userTeams.map(team => (
              <label 
                key={team.team_id} 
                className={`relative px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
                  filter === team.team_id 
                    ? 'bg-[#9334E9] text-[#FAFAFA] hover:cursor-not-allowed' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <input
                  type="radio"
                  value={team.team_id}
                  checked={filter === team.team_id}
                  onChange={(e) => setFilter(e.target.value)}
                  className="absolute opacity-0"
                />
                <span className="text-sm font-medium">{team.teams?.team_name || 'Unknown Team'}</span>
              </label>
            ))}
          </div>

          <div className="mb-6 relative">
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1C1C1E] text-white placeholder-zinc-400 rounded-lg px-10 py-3 border-0 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
          </div>

          {error && (
            <div className="text-red-500 mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredTranscripts.map((transcript) => (
              <Link key={transcript.id} href={`/meetings/${transcript.id}`}>
                <div className="bg-[#09090A] border border-zinc-800 hover:bg-[#27272A] transition-colors rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-[#9334E9]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-white font-medium mb-2">{transcript.title}</h2>
                      {filter !== 'personal' && (
                        <div className="text-purple-500 text-sm mb-2">
                          {transcript.team_name}
                        </div>
                      )}
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
              <p>No meetings found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 