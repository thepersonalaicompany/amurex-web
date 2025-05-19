"use client";

import { useState, useEffect } from "react";
import { FileText, Search, Calendar, Clock, Video, BellRing } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import IconToggle from "@/components/ui/IconToggle";
import { toast } from "react-hot-toast";

export default function TranscriptList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("personal");
  const router = useRouter();
  const [userTeams, setUserTeams] = useState([]);
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);

  useEffect(() => {
    fetchTranscripts();
    fetchUserTeams();
    fetchUserSettings();
  }, [filter]);

  const fetchTranscripts = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/web_app/signin");
        return;
      }

      if (filter !== "personal") {
        // Get meetings for specific team
        const { data: teamMeetings, error: meetingsError } = await supabase
          .from("meetings_teams")
          .select(
            `
            meeting_id,
            team_id
          `
          )
          .eq("team_id", filter); // Filter by specific team_id

        if (meetingsError) throw meetingsError;
        if (!teamMeetings?.length) {
          setTranscripts([]);
          setLoading(false);
          return;
        }

        // 2. Then get all meetings for those teams
        const { data, error } = await supabase
          .from("late_meeting")
          .select(
            `
            id,
            meeting_id,
            user_ids,
            created_at,
            meeting_title,
            summary,
            transcript,
            action_items
          `
          )
          .in(
            "id",
            teamMeetings.map((meeting) => meeting.meeting_id)
          )
          .order("created_at", { ascending: false })
          .not("transcript", "is", null);

        if (error) throw error;

        // Match meetings with their team information
        const meetingsWithTeams = data.map((meeting) => {
          const teamMeeting = teamMeetings.find(
            (tm) => tm.meeting_id === meeting.id
          );
          const teamInfo = userTeams.find(
            (ut) => ut.team_id === teamMeeting?.team_id
          );
          return {
            ...meeting,
            team_name: teamInfo?.teams?.team_name || "Unknown Team",
          };
        });

        setTranscripts(formatTranscripts(meetingsWithTeams));
      } else {
        // Personal meetings query
        const { data, error } = await supabase
          .from("late_meeting")
          .select(
            `
            id,
            meeting_id,
            user_ids,
            created_at,
            meeting_title,
            summary,
            transcript,
            action_items
          `
          )
          .contains("user_ids", [session.user.id])
          .order("created_at", { ascending: false })
          .not("transcript", "is", null);

        if (error) throw error;
        setTranscripts(formatTranscripts(data));
      }
    } catch (err) {
      console.error("Error fetching transcripts:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTeams = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from("team_members")
        .select(
          `
          team_id,
          teams (
            id,
            team_name
          )
        `
        )
        .eq("user_id", session.user.id);

      if (error) throw error;
      setUserTeams(data || []);
    } catch (err) {
      console.error("Error fetching teams:", err);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user, error } = await supabase
        .from("users")
        .select("emails_enabled")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      if (user) {
        setEmailNotificationsEnabled(user.emails_enabled || false);
      }
    } catch (err) {
      console.error("Error fetching user settings:", err);
    }
  };

  const handleEmailNotificationsToggle = async (checked) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from("users")
          .update({ emails_enabled: checked })
          .eq("id", session.user.id);

        if (error) throw error;
        setEmailNotificationsEnabled(checked);
        toast.success(checked ? "Email notifications enabled" : "Email notifications disabled");
      }
    } catch (error) {
      console.error("Error updating email notification settings:", error);
      toast.error("Failed to update email settings");
    }
  };

  const formatTranscripts = (data) => {
    return data.map((meeting) => ({
      id: meeting.id,
      meeting_id: meeting.meeting_id,
      title: meeting.meeting_title || "Untitled Meeting",
      date: new Date(meeting.created_at).toLocaleDateString(),
      time: new Date(meeting.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      summary: meeting.summary,
      transcript: meeting.transcript,
      action_items: meeting.action_items,
      team_name: meeting.team_name,
    }));
  };

  const filteredTranscripts = transcripts.filter((transcript) =>
    transcript.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="p-8 mx-auto">
          <h1 className="text-2xl font-medium mb-6 text-white">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black">
        <div className="p-8 mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-medium text-white">Meetings</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-white" />
                <div className="text-white hidden sm:block">Email notes after meetings</div>
                <IconToggle 
                  checked={emailNotificationsEnabled}
                  onChange={handleEmailNotificationsToggle}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6 flex-wrap bg-[#1C1C1E] p-1 rounded-lg w-fit hidden">
            <label
              className={`relative px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
                filter === "personal"
                  ? "bg-[#9334E9] text-[#FAFAFA] hover:cursor-not-allowed"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <input
                type="radio"
                value="personal"
                checked={filter === "personal"}
                onChange={(e) => setFilter(e.target.value)}
                className="absolute opacity-0"
              />
              <span className="text-sm font-medium">Personal</span>
            </label>
            {userTeams.map((team) => (
              <label
                key={team.team_id}
                className={`relative px-4 py-2 rounded-md cursor-pointer transition-all duration-200 ${
                  filter === team.team_id
                    ? "bg-[#9334E9] text-[#FAFAFA] hover:cursor-not-allowed"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <input
                  type="radio"
                  value={team.team_id}
                  checked={filter === team.team_id}
                  onChange={(e) => setFilter(e.target.value)}
                  className="absolute opacity-0"
                />
                <span className="text-sm font-medium">
                  {team.teams?.team_name || "Unknown Team"}
                </span>
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
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400"
              size={18}
            />
          </div>

          <a href="/search" rel="noopener noreferrer">
            <div 
              className="hidden my-2 bg-zinc-800/80 rounded-xl flex items-center px-3 py-2 cursor-text hover:bg-zinc-700 transition-colors border border-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 mr-2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <div className="text-zinc-400 text-md">Search in meetings...</div>
            </div>
          </a>

          {error && <div className="text-red-500 mb-4">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredTranscripts.map((transcript) => (
              <Link key={transcript.id} href={`/meetings/${transcript.id}`}>
                <div className="bg-[#09090A] border border-zinc-800 hover:bg-[#27272A] transition-colors rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-[#9334E9]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-white font-medium mb-2">
                        {transcript.title}
                      </h2>
                      {filter !== "personal" && (
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

          {transcripts.length === 0 && (
            <>
              {/* Email categorization card */}
              <div className="mt-8 mx-auto max-w-4xl">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9334E9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
                  <Card className="bg-black border-zinc-500 relative overflow-hidden w-full">
                    <div className="absolute inset-0 bg-[#9334E9]/20 animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#9334E9]/30 via-[#9334E9]/20 to-[#9334E9]/30"></div>
                    <CardContent className="p-4 relative text-center">
                      <div className="flex items-center gap-4 justify-center">
                        <Video className="w-6 h-6 text-[#9334E9] hidden" />
                        <div>
                          <h3 className="font-medium text-white text-lg">
                            Try Amurex for Online Meetings
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Get AI-powered summaries for your meetings
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <a
                          href="https://chromewebstore.google.com/detail/amurex-early-preview/dckidmhhpnfhachdpobgfbjnhfnmddmc"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors duration-200"
                        >
                          Get Chrome Extension
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Google Meet preview */}
              <div className="mt-8 mx-auto max-w-4xl">
                <MeetPreview />
              </div>
            </>
          )}

          {filteredTranscripts.length === 0 && (
            <>
              {/* No meetings found card */}
              <div className="mt-8 mx-auto text-center">
                <h3 className="font-medium text-white text-2xl">
                  No meetings found for <b>{searchTerm}</b>
                </h3>
                <p className="text-lg text-zinc-400">
                  Please try a different search query, or
                </p>
                <div className="relative w-[50%] mx-auto mt-6">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9334E9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
                  <Card className="bg-black border-zinc-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[#9334E9]/20 animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#9334E9]/30 via-[#9334E9]/20 to-[#9334E9]/30"></div>
                    <CardContent className="p-4 relative text-center">
                      <div className="flex items-center gap-4 justify-center">
                        <Video className="w-6 h-6 text-[#9334E9] hidden" />
                        <div className="w-[80%]">
                          <h3 className="font-medium text-white text-2xl mb-2">
                            Try a smarter search
                          </h3>
                          <p className="text-md font-light text-white">
                            Knowledge Search - our new feature that allows you to <br></br><span className="italic">search your meetings, emails, and documents</span>
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <a
                          href="/search"
                          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors duration-200"
                        >
                          Try Knowledge Search
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const MeetPreview = () => {
  return (
    <div className="relative mt-8 mx-auto max-w-4xl rounded-xl overflow-hidden border border-zinc-800">
      {/* Main meeting area - using gmeet.png as background */}
      <div className="bg-[#0f0f10] h-[450px] relative" style={{ 
        backgroundImage: "url('/gmeet_new.png')", 
        backgroundSize: "cover",
        backgroundPosition: "right center"
      }}>
        {/* Dimming overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        <div className="flex items-center justify-start pl-4 pt-4 relative z-10">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Google_Meet_icon_%282020%29.svg/1024px-Google_Meet_icon_%282020%29.svg.png?20221213135236"
            alt="Google Meet"
            className="w-8"
          />
          <span className="pl-2 text-white text-base">Google Meet</span>
        </div>
        {/* Meeting controls - positioned at bottom center */}
        <div className="absolute bottom-8 left-1/3 transform -translate-x-1/2 flex items-center gap-6 z-10">
          <div className="w-14 h-14 rounded-full bg-[#ea4335] flex items-center justify-center">
            <span className="text-white text-2xl">×</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#3c4043] flex items-center justify-center">
            <span className="text-white text-xl">🎤</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#3c4043] flex items-center justify-center">
            <span className="text-white text-xl">📹</span>
          </div>
        </div>
      </div>
      
      {/* Amurex sidepanel */}
      <div className="absolute top-0 right-0 h-full w-[380px] bg-[#0a0a0a] border-l border-zinc-800">
        {/* Amurex header */}
        <div className="flex items-center justify-between py-2 px-4 border-b border-zinc-800">
          <div className="flex items-center">
            <span className="text-white text-xl font-medium">Amurex</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-lg">⚙️</span>
            <span className="text-zinc-400 text-lg">➡️</span>
          </div>
        </div>
        
        {/* Sidepanel content - smaller text */}
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-white text-lg font-medium mb-2">Action items</h3>
            <div className="text-zinc-300 text-sm">
              <p className="mb-2 font-bold">You</p>
              <ul className="list-disc pl-5 mb-2">
                <li>Start using Amurex for your meetings</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="text-white text-lg font-medium mb-2">Summary</h3>
            <div className="text-zinc-300 text-sm">
              <p className="mb-2"><span className="font-medium">Date:</span> September 14, 2024</p>
              <p className="mb-1"><span className="font-medium">Participants:</span></p>
              <ul className="list-disc pl-5 mb-2">
                <li>You</li>
              </ul>
              <p className="mb-1"><span className="font-medium">Summary:</span></p>
              <ul className="list-disc pl-5 mb-2">
                <li>Onboarding process to get started with Amurex.</li>
              </ul>
              <p className="mb-1"><span className="font-medium">Key Points:</span></p>
              <ul className="list-disc pl-5">
                <li>Amurex will help you organize your work and life.</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Bottom tabs */}
        <div className="absolute bottom-0 w-full flex border-t border-zinc-800">
          <div className="flex-1 py-4 text-center text-purple-500 border-t-2 border-purple-500 font-medium text-base">
            Summary
          </div>
          <div className="flex-1 py-4 text-center text-zinc-400 font-medium text-base">
            Live Suggestions
          </div>
        </div>
      </div>
    </div>
  );
};

