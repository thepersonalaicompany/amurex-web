"use client";

import { create } from "zustand";
import { TrascriptListStoreType } from "./types";
import { supabase } from "@amurex/supabase";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export const useTranscriptListStore = create<TrascriptListStoreType>(
  (set, get) => ({
    searchTerm: "",
    setSearchTerm: (value) => set({ searchTerm: value }),

    transcripts: [],
    setTranscripts: (transcripts) => set({ transcripts }),

    loading: false,
    setLoading: (loading) => set({ loading }),

    error: null,
    setError: (error) => set({ error }),

    filter: "personal",
    setFilter: (filter) => set({ filter }),

    userTeams: [],
    setUserTeams: (teams) => set({ userTeams: teams }),

    emailNotificationsEnabled: false,
    setEmailNotificationsEnabled: (value) =>
      set({ emailNotificationsEnabled: value }),

    fetchTranscripts: async (router) => {
      const {
        setError,
        setLoading,
        filter,
        setTranscripts,
        userTeams,
        formatTranscripts,
      } = get();
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
            .select(`meeting_id, team_id`)
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
                `,
            )
            .in(
              "id",
              teamMeetings.map((meeting) => meeting.meeting_id),
            )
            .order("created_at", { ascending: false })
            .not("transcript", "is", null);

          if (error) throw error;

          // Match meetings with their team information
          const meetingsWithTeams = data.map((meeting) => {
            const teamMeeting = teamMeetings.find(
              (tm) => tm.meeting_id === meeting.meeting_id,
            );
            const teamInfo = userTeams.find(
              (ut) => ut.team_id === teamMeeting?.team_id,
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
                `,
            )
            .contains("user_ids", [session.user.id])
            .order("created_at", { ascending: false })
            .not("transcript", "is", null);

          if (error) throw error;
          setTranscripts(formatTranscripts(data));
        }
      } catch (err: any) {
        console.error("Error fetching transcripts:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },

    fetchUserTeams: async () => {
      const { setUserTeams } = get();
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
        `,
          )
          .eq("user_id", session.user.id);

        if (error) throw error;
        setUserTeams(
          data?.map((item) => ({
            team_id: item.team_id,
            teams: {
              id: item.teams[0]?.id || "",
              team_name: item.teams[0]?.team_name || "",
            },
          })) || [],
        );
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    },

    fetchUserSettings: async () => {
      const { setEmailNotificationsEnabled } = get();
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
      } catch (err: unknown) {
        console.error("Error fetching user settings:", err);
      }
    },

    handleEmailNotificationsToggle: async (checked) => {
      const { setEmailNotificationsEnabled } = get();
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
          toast.success(
            checked
              ? "Email notifications enabled"
              : "Email notifications disabled",
          );
        }
      } catch (error) {
        console.error("Error updating email notification settings:", error);
        toast.error("Failed to update email settings");
      }
    },

    formatTranscripts: (data) => {
      return data.map((meeting: any) => ({
        id: meeting.id,
        meeting_id: meeting.meeting_id,
        title: meeting.meeting_title || "Untitled Meeting",
        date: new Date(meeting.created_at).toLocaleDateString(),
        time: new Date(meeting.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        summary: meeting.summary,
        content: meeting.transcript,
        actionItems: meeting.action_items,
      }));
    },
  }),
);
