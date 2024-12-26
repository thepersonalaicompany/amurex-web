"use client";

import { useState } from 'react'
import { FileText, Search, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

const transcripts = [
  {
    id: 1,
    title: "Team Meeting - Q4 Goals Review",
    date: "2024-12-24",
    time: "10:00 AM",
    duration: "1h 30m",
  },
  {
    id: 2,
    title: "Client Presentation - Product Demo",
    date: "2024-12-23",
    time: "2:00 PM",
    duration: "45m",
  },
  {
    id: 3,
    title: "Marketing Strategy Session",
    date: "2024-12-22",
    time: "11:00 AM",
    duration: "2h",
  },
  {
    id: 4,
    title: "Product Development Sync",
    date: "2024-12-21",
    time: "3:30 PM",
    duration: "1h",
  },
  {
    id: 5,
    title: "HR Policy Update Meeting",
    date: "2024-12-20",
    time: "9:00 AM",
    duration: "1h 15m",
  },
  {
    id: 6,
    title: "Financial Quarter Review",
    date: "2024-12-19",
    time: "2:30 PM",
    duration: "2h 30m",
  },
]

export default function TranscriptList() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTranscripts = transcripts.filter(transcript =>
    transcript.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#09090B]">
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
                      <span className="text-purple-500 text-sm">{transcript.duration}</span>
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