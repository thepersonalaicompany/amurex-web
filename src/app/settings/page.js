"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  MessageSquare,
  FileText,
  Cloud,
  Github,
  Bug,
  LogOut,
  Video,
  Calendar,
  Pencil,
  UserPlus,
  Plus,
  Minus,
} from "lucide-react";
import Cookies from "js-cookie";
import { X } from "@phosphor-icons/react";
import { Navbar } from "@/components/Navbar";
import { toast } from "react-hot-toast";
import Intercom from '@intercom/messenger-js-sdk';
const PROVIDER_ICONS = {
  google:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png",
  notion:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Notion-logo.svg/2048px-Notion-logo.svg.png",
  obsidian: "https://obsidian.md/images/obsidian-logo-gradient.svg",
  gmail: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png",
};

const BASE_URL_BACKEND = "https://api.amurex.ai";

function SettingsContent() {
  const [activeTab, setActiveTab] = useState("personalization");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [notionConnected, setNotionConnected] = useState(false);
  const [googleDocsConnected, setGoogleDocsConnected] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [notionDocuments, setNotionDocuments] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSource, setImportSource] = useState("");
  const [importProgress, setImportProgress] = useState(0);
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [createdAt, setCreatedAt] = useState("");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] =
    useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);
  const [emailLabelingEnabled, setEmailLabelingEnabled] = useState(false);
  const [processedEmailCount, setProcessedEmailCount] = useState(0);
  const [teamName, setTeamName] = useState("");
  const [teamLocation, setTeamLocation] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [teamCreatedAt, setTeamCreatedAt] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editedRole, setEditedRole] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState([]);
  const [teamInviteCode, setTeamInviteCode] = useState("");
  const [copyButtonText, setCopyButtonText] = useState("Copy URL");
  const [isMobile, setIsMobile] = useState(false);
  const [isObsidianModalOpen, setIsObsidianModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState(null);
  const [gmailPermissionError, setGmailPermissionError] = useState(false);

  // Modify the session check useEffect
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Redirect if no session
      if (!session) {
        const currentPath = window.location.pathname + window.location.search;
        const encodedRedirect = encodeURIComponent(currentPath);
        router.push(`/web_app/signin?redirect=${encodedRedirect}`);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // Redirect if session is terminated
      if (!session) {
        const currentPath = window.location.pathname + window.location.search;
        const encodedRedirect = encodeURIComponent(currentPath);
        router.push(`/web_app/signin?redirect=${encodedRedirect}`);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    checkIntegrations();
  }, []);

  useEffect(() => {
    const connection = searchParams.get("connection");
    const error = searchParams.get("error");

    if (connection === "success") {
      toast.success("Google Docs connected successfully!");
    }
    if (error) {
      toast.error(`Connection failed: ${error}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const checkEmailSettings = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const { data: user, error } = await supabase
            .from("users")
            .select("emails_enabled")
            .eq("id", session.user.id)
            .single();

          if (user) {
            setEmailNotificationsEnabled(user.emails_enabled);
          }
        }
      } catch (error) {
        console.error("Error checking email settings:", error);
      }
    };

    checkEmailSettings();
  }, []);

  const handleGoogleDocsConnect = useCallback(async () => {
    console.log("Starting Google Docs connection flow...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch("/api/google/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const data = await response.json();
        if (data.url) {
          console.log(
            "Setting pendingGoogleDocsImport flag before OAuth redirect"
          );
          localStorage.setItem("pendingGoogleDocsImport", "true");
          router.push(data.url);
        } else {
          console.error("Error starting Google OAuth flow:", data.error);
        }
      }
    } catch (error) {
      console.error("Error connecting Google Docs:", error);
    }
  }, [router]);

  const importGoogleDocs = useCallback(async () => {
    if (googleDocsConnected) {
      console.log("Starting Google Docs import process...");
      setIsImporting(true);
      setImportSource("Google Docs");

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      try {
        const response = await fetch("/api/google/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            userId: session.user.id,
            accessToken: accessToken,
          }),
        });

        const data = await response.json();

        if (data.success) {
          console.log("Google Docs import initiated:", data);
          toast.success("Import complete! Check your email for details.");
        } else {
          console.error("Error importing Google docs:", data.error);
          toast.error("Import failed. Please try again.");
        }
      } catch (error) {
        console.error("Error importing Google docs:", error);
        toast.error("Import failed. Please try again.");
      } finally {
        console.log("Import process completed");
        setIsImporting(false);
        setImportSource("");
        setImportProgress(0);
      }
    }
  }, [googleDocsConnected]);

  const importNotionDocuments = useCallback(async () => {
    if (notionConnected) {
      setIsImporting(true);
      setImportSource("Notion");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      try {
        const response = await fetch("/api/notion/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session: session }),
        });
        const data = await response.json();

        if (data.success) {
          setNotionDocuments(data.documents);
        } else {
          console.log("Data:", data);
          console.error("Error importing Notion documents:", data.error);
        }
      } catch (error) {
        console.log("Error:", error);
        console.error("Error importing Notion documents:", error);
      } finally {
        setTimeout(() => {
          setIsImporting(false);
          setImportSource("");
          setImportProgress(0);
        }, 1000);
      }
    }
  }, [notionConnected]);

  const processGmailLabels = useCallback(async () => {
    try {
      setIsProcessingEmails(true);
      setProcessedEmailCount(0);
      setGmailPermissionError(false);
      
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in to process emails");
        setIsProcessingEmails(false);
        return;
      }
      
      const response = await fetch("/api/gmail/process-labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          // Allow custom colors to be applied
          useStandardColors: false
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProcessedEmailCount(data.processed || 0);
        toast.success(`Successfully processed ${data.processed} emails`);
      } else {
        if (data.errorType === "insufficient_permissions") {
          setGmailPermissionError(true);
          toast.error("Insufficient Gmail permissions. Please reconnect your Google account.");
        } else {
          toast.error(data.error || "Failed to process emails");
        }
      }
    } catch (error) {
      console.error("Error processing Gmail labels:", error);
      toast.error("Failed to process emails");
    } finally {
      setIsProcessingEmails(false);
    }
  }, []);

  const handleReconnectGoogle = useCallback(() => {
    localStorage.setItem("pendingGmailReconnect", "true");
    handleGoogleDocsConnect();
    toast.success("Please reconnect your Google account with the necessary permissions");
  }, [handleGoogleDocsConnect]);

  // Update the useEffect to check for pending imports as well
  useEffect(() => {
    const checkPendingImports = async () => {
      console.log("Checking for pending imports...");
      const pendingGoogleImport = localStorage.getItem(
        "pendingGoogleDocsImport"
      );
      const pendingNotionImport = localStorage.getItem("pendingNotionImport");
      const pendingGmailReconnect = localStorage.getItem("pendingGmailReconnect");

      if (pendingGoogleImport === "true" && googleDocsConnected) {
        console.log(
          "Found pending Google import, starting Google Docs import..."
        );
        localStorage.removeItem("pendingGoogleDocsImport");
        await importGoogleDocs();
      }

      if (pendingNotionImport === "true" && notionConnected) {
        console.log("Found pending Notion import, starting Notion import...");
        localStorage.removeItem("pendingNotionImport");
        await importNotionDocuments();
      }
      
      if (pendingGmailReconnect === "true" && googleDocsConnected) {
        console.log("Found pending Gmail reconnect, checking permissions...");
        localStorage.removeItem("pendingGmailReconnect");
        setGmailPermissionError(false);
        if (emailLabelingEnabled) {
          await processGmailLabels();
        }
      }
    };

    checkPendingImports();
  }, [
    googleDocsConnected,
    notionConnected,
    importGoogleDocs,
    importNotionDocuments,
    emailLabelingEnabled,
    processGmailLabels,
  ]);

  const checkIntegrations = async () => {
    try {
      console.log("checkIntegrations");
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (session) {
        const { data: user, error } = await supabase
          .from("users")
          .select(
            "notion_connected, google_docs_connected, calendar_connected, memory_enabled, email, created_at, email_tagging_enabled"
          )
          .eq("id", session.user.id)
          .single();
        console.log("user", user);

        if (user) {
          setUserEmail(user.email);
          setCreatedAt(
            new Date(user.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          );
          setNotionConnected(user.notion_connected);
          setGoogleDocsConnected(user.google_docs_connected);
          setCalendarConnected(user.calendar_connected);
          setMemoryEnabled(user.memory_enabled);
          setEmailLabelingEnabled(user.email_tagging_enabled || false);
        }
      }
    } catch (error) {
      console.error("Error checking integrations:", error);
    }
  };

  const initiateLogout = () => {
    setShowSignOutConfirm(true);
  };

  const handleLogout = async () => {
    setShowSignOutConfirm(false);
    setLoading(true);

    // Clear local storage and cookies
    console.log("Clearing cookies");
    localStorage.removeItem("amurex_session");
    Cookies.remove("amurex_session", {
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // If in extension environment, send message to clear extension storage
    if (window.chrome && chrome.runtime && chrome.runtime.id) {
      try {
        window.postMessage(
          {
            type: "AMUREX_LOGOUT",
          },
          "*"
        );
      } catch (err) {
        console.error("Error sending logout message to extension:", err);
      }
    }

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      const currentPath = window.location.pathname + window.location.search;
      const encodedRedirect = encodeURIComponent(currentPath);
      router.push(`/web_app/signin?redirect=${encodedRedirect}`);
    }

    setLoading(false);
  };

  const handleNotionConnect = async () => {
    console.log("Starting Notion connection flow...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch("/api/notion/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const data = await response.json();
        if (data.url) {
          console.log("Setting pendingNotionImport flag before OAuth redirect");
          localStorage.setItem("pendingNotionImport", "true");
          router.push(data.url);
        } else {
          console.error("Error starting Notion OAuth flow:", data.error);
          toast.error("Failed to connect Notion");
        }
      }
    } catch (error) {
      console.error("Error connecting Notion:", error);
      toast.error("Failed to connect Notion");
    }
  };

  const handleCalendarConnect = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const response = await fetch("/api/google/auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: session.user.id }),
        });
        const data = await response.json();
        if (data.url) {
          router.push(data.url);
        } else {
          console.error("Error starting Google OAuth flow:", data.error);
        }
      }
    } catch (error) {
      console.error("Error connecting Google services:", error);
    }
  };

  const handleMemoryToggle = async (checked) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from("users")
          .update({ memory_enabled: checked })
          .eq("id", session.user.id);

        if (error) throw error;
        setMemoryEnabled(checked);
      }
    } catch (error) {
      console.error("Error updating memory settings:", error);
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
      }
    } catch (error) {
      console.error("Error updating email notification settings:", error);
      toast.error("Failed to update email settings");
    }
  };

  const handleGoogleCallback = useCallback(async () => {
    console.log("Handling Google callback");
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    if (code) {
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Exchange code for tokens
        const response = await fetch("/api/google/callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            state,
            userId: session?.user?.id,
          }),
        });

        const data = await response.json();

        if (data.success) {
          await checkIntegrations(); // Refresh integration status
          toast.success("Google Docs connected successfully!");

          // Trigger import if there's a pending import flag
          const pendingImport = localStorage.getItem("pendingGoogleDocsImport");
          if (pendingImport === "true") {
            console.log("Starting import after successful connection...");
            localStorage.removeItem("pendingGoogleDocsImport");
            await importGoogleDocs();
          }
        } else {
          console.error("Connection failed:", data.error);
          toast.error("Failed to connect Google Docs");
        }
      } catch (err) {
        console.error("Error in Google callback:", err);
        toast.error("Failed to connect Google Docs");
      }
    }

    if (error) {
      toast.error(`Connection failed: ${error}`);
    }
  }, [searchParams, importGoogleDocs, checkIntegrations]);

  // Update the useEffect to run handleGoogleCallback when code is present
  useEffect(() => {
    if (searchParams.get("code")) {
      handleGoogleCallback();
    }
  }, [searchParams, handleGoogleCallback]);

  const logUserAction = async (userId, eventType) => {
    try {
      await fetch(`${BASE_URL_BACKEND}/track`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          uuid: userId,
          event_type: eventType,
        }),
      });
    } catch (error) {
      console.error("Error tracking:", error);
    }
  };

  const handleSave = async (field) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Get team_id from team_members
      const { data: teamMember, error: memberError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", session.user.id)
        .single();

      if (memberError) throw memberError;

      const updateData = {};
      if (field === "name") {
        updateData.team_name = editedName;
      } else if (field === "location") {
        updateData.location = editedLocation;
      }

      const { error } = await supabase
        .from("teams")
        .update(updateData)
        .eq("id", teamMember.team_id);

      if (error) throw error;

      if (field === "name") setTeamName(editedName);
      if (field === "location") setTeamLocation(editedLocation);
      setEditingField(null);
      toast.success("Team updated successfully");
    } catch (error) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
    }
  };

  const getInitials = (fullName, email) => {
    if (fullName) {
      const names = fullName.split(" ");
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return fullName[0].toUpperCase();
    }
    return email[0].toUpperCase();
  };

  const handleRoleUpdate = async (memberId) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: editedRole })
        .eq("id", memberId);

      if (error) throw error;

      setTeamMembers((members) =>
        members.map((member) =>
          member.id === memberId ? { ...member, role: editedRole } : member
        )
      );

      setEditingMemberId(null);
      toast.success("Member role updated successfully");
    } catch (error) {
      console.error("Error updating member role:", error);
      toast.error("Failed to update member role");
    }
  };

  // Add useEffect to fetch team details through team_members
  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        // First get the team membership
        const { data: teamMember, error: memberError } = await supabase
          .from("team_members")
          .select(
            `
            id,
            role,
            team_id,
            teams (
              id,
              team_name,
              location,
              created_at
            )
          `
          )
          .eq("user_id", session.user.id)
          .single();

        if (memberError) throw memberError;

        if (teamMember?.teams) {
          const team = teamMember.teams;
          setTeamName(team.team_name);
          setEditedName(team.team_name);
          setTeamLocation(team.location || "");
          setEditedLocation(team.location || "");
          setTeamCreatedAt(
            new Date(team.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          );
          setCurrentUserRole(teamMember.role);

          // Fetch team members
          const { data: members, error: membersError } = await supabase
            .from("team_members")
            .select(
              `
              id,
              role,
              created_at,
              name,
              users (
                id,
                email
              )
            `
            )
            .eq("team_id", team.id);

          if (membersError) throw membersError;
          setTeamMembers(members);
        }
      } catch (error) {
        console.error("Error fetching team details:", error);
        toast.error("Failed to load team details");
      } finally {
        setMembersLoading(false);
      }
    };

    fetchTeamDetails();
  }, []);

  // Add email handling functions
  const handleEmailInputChange = (e) => {
    setEmailInput(e.target.value);
  };

  const handleEmailInputKeyDown = (e) => {
    if (e.key === "Enter" && emailInput.trim()) {
      addEmail();
    }
  };

  const addEmail = () => {
    if (emailInput.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setEmails([...emails, emailInput.trim()]);
      setEmailInput("");
    } else {
      toast.error("Please enter a valid email address");
    }
  };

  const removeEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.host}/teams/join/${teamInviteCode}`
      );
      setCopyButtonText("Copied!");
      setTimeout(() => setCopyButtonText("Copy URL"), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy link");
    }
  };

  const sendInvites = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Get team_id from team_members
      const { data: teamMember, error: memberError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", session.user.id)
        .single();

      if (memberError) throw memberError;

      // Send invites
      const response = await fetch("/api/teams/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: teamMember.team_id,
          emails: emails,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Invites sent successfully!");
        setEmails([]);
        setIsInviteModalOpen(false);
      } else {
        throw new Error(data.error || "Failed to send invites");
      }
    } catch (error) {
      console.error("Error sending invites:", error);
      toast.error("Failed to send invites");
    }
  };

  // Add useEffect for mobile detection
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // Add useEffect to fetch team invite code
  useEffect(() => {
    const fetchTeamInviteCode = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        const { data: teamMember, error: memberError } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", session.user.id)
          .single();

        if (memberError) throw memberError;

        const { data: team, error: teamError } = await supabase
          .from("teams")
          .select("invite_code")
          .eq("id", teamMember.team_id)
          .single();

        if (teamError) throw teamError;

        setTeamInviteCode(team.invite_code);
      } catch (error) {
        console.error("Error fetching team invite code:", error);
      }
    };

    fetchTeamInviteCode();
  }, []);

  // Update the handleFileSelect function
  const handleFileSelect = (e) => {
    const files = Array.from(
      e.target?.files || e.dataTransfer?.files || []
    ).filter((file) => file.name.endsWith(".md"));
    setSelectedFiles(files);
  };

  // Add drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add("border-[#9334E9]");
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-[#9334E9]");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("border-[#9334E9]");
    handleFileSelect(e);
  };

  // Add new function to handle file upload
  const handleObsidianUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const content = await file.text();

        const response = await fetch("/api/obsidian/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            content: content,
            userId: session.user.id,
          }),
        });

        if (!response.ok) throw new Error("Upload failed");

        setUploadProgress(((i + 1) / selectedFiles.length) * 100);
      }

      toast.success("Markdown files uploaded successfully!");
      setIsObsidianModalOpen(false);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  useEffect(() => {
    // Get tab from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    } else {
      // Set default tab and update URL
      router.push(`${window.location.pathname}?tab=personalization`);
    }
  }, [router]);

  const handleTabChange = (tabName) => {
    // Update URL with new tab
    router.push(`${window.location.pathname}?tab=${tabName}`);
    setActiveTab(tabName);
  };

  const handleEmailLabelToggle = async (checked) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from("users")
          .update({ email_tagging_enabled: checked })
          .eq("id", session.user.id);

        if (error) throw error;
        setEmailLabelingEnabled(checked);
        toast.success(checked ? "Email labeling enabled" : "Email labeling disabled");
      }
    } catch (error) {
      console.error("Error updating email labeling settings:", error);
      toast.error("Failed to update email labeling settings");
    }
  };

  // Add useEffect to get and store userId
  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUserId(session.user.id);
      }
    };
    
    fetchUserId();
  }, []);



  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Left App Navbar - the thin one */}
      <div className="w-16 flex-shrink-0 bg-black border-r border-zinc-800">
        <Navbar />
      </div>

      {/* Main Settings Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-64 flex-shrink-0 bg-black p-4 border-r border-zinc-800 overflow-y-auto">
          <h2 className="text-2xl font-medium text-white mb-6">Settings</h2>
          <div className="text-md space-y-2">
            <button
              onClick={() => handleTabChange("personalization")}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === "personalization"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Personalization
            </button>
            <button
              onClick={() => handleTabChange("account")}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === "account"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Account
            </button>
            <button
              onClick={() => handleTabChange("team")}
              className={`w-full text-left px-4 py-2 rounded-lg hidden ${
                activeTab === "team"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Team
            </button>
            <button
              onClick={() => handleTabChange("feedback")}
              className={`w-full text-left px-4 py-2 rounded-lg ${
                activeTab === "feedback"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Feedback
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-black overflow-y-auto">
          <div className="space-y-4 mb-4">
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9334E9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
              <Card className="bg-black border-zinc-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-[#9334E9]/20 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#9334E9]/30 via-[#9334E9]/20 to-[#9334E9]/30"></div>
                <CardContent className="p-4 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <MessageSquare className="w-6 h-6 text-[#9334E9]" />
                      <div>
                        <h3 className="font-medium text-white text-lg">
                          Memory Chat (new!)
                        </h3>
                        <p className="text-sm text-zinc-400">
                          Try our new memory chat feature
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9334E9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
                      <Button
                        variant="outline"
                        className="relative bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:border-[#9334E9] border border-zinc-800 rounded-md backdrop-blur-sm transition-colors duration-200"
                        onClick={async () => {
                          console.log("clicked");
                          
                          // Track button click with analytics
                          try {
                            // Log the user action for analytics using stored userId
                            await logUserAction(
                              userId || "not-required", // Use userId if available, fallback to "not-required"
                              "web_memory_chat_tried"
                            );
                            
                            // Navigate to chat page
                            router.push("/chat");
                          } catch (error) {
                            console.error("Analytics error:", error);
                            // Still navigate even if analytics fails
                            router.push("/chat");
                          }
                        }}
                      >
                        Try Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {activeTab === "personalization" && (
            <div className="space-y-8">
              <h1 className="text-2xl font-medium text-white">
                Personalization
              </h1>

              {/* Memory Toggle */}
              <Card className="bg-black border-zinc-800">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                        <Cloud className="w-5 h-5 text-[#9334E9]" />
                        Memory
                      </h2>
                      <p className="text-sm text-zinc-400">
                        Enable memory and connect your documents to unlock our{" "}
                        <b>AI-powered memory chat feature</b>, allowing you to
                        have intelligent conversations about your content
                      </p>
                    </div>
                    <Switch
                      checked={memoryEnabled}
                      onCheckedChange={handleMemoryToggle}
                      className={memoryEnabled ? "bg-[#9334E9]" : ""}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Card className="bg-black border-zinc-800 flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={PROVIDER_ICONS.google}
                              alt="Google"
                              className="w-6 h-6"
                            />
                            <div>
                              <h3 className="font-medium text-white text-lg">
                                Connect Google
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Sync your Google Docs
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className={`bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 ${
                              googleDocsConnected
                                ? "bg-green-900 hover:bg-green-800"
                                : ""
                            } min-w-[100px]`}
                            onClick={handleGoogleDocsConnect}
                            disabled={
                              isImporting && importSource === "Google Docs"
                            }
                          >
                            {isImporting && importSource === "Google Docs" ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9334E9] mr-2"></div>
                                Importing...
                              </div>
                            ) : googleDocsConnected ? (
                              "Connected"
                            ) : (
                              "Connect"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black border-zinc-800 flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={PROVIDER_ICONS.notion}
                              alt="Notion"
                              className="w-6 h-6"
                            />
                            <div>
                              <h3 className="font-medium text-white text-lg">
                                Connect Notion
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Sync your Notion pages
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className={`bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 ${
                              notionConnected
                                ? "bg-green-900 hover:bg-green-800"
                                : ""
                            } min-w-[100px]`}
                            onClick={handleNotionConnect}
                            disabled={isImporting && importSource === "Notion"}
                          >
                            {isImporting && importSource === "Notion" ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9334E9] mr-2"></div>
                                Importing...
                              </div>
                            ) : notionConnected ? (
                              "Connected"
                            ) : (
                              "Connect"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-4">
                    <Card className="bg-black border-zinc-800 flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={PROVIDER_ICONS.obsidian}
                              alt="Obsidian"
                              className="w-6 h-6"
                            />
                            <div>
                              <h3 className="font-medium text-white text-lg">
                                Upload from Obsidian
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Import your markdown files
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 min-w-[100px]"
                            onClick={() => setIsObsidianModalOpen(true)}
                          >
                            Upload
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-black border-zinc-800 flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white text-lg">
                                Request Integration
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Suggest the next integration
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 min-w-[100px]"
                            onClick={() =>
                              window.open(
                                "https://github.com/thepersonalaicompany/amurex-web/issues/new",
                                "_blank"
                              )
                            }
                          >
                            Request
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex gap-4 mt-4">
                    <Card className="bg-black border-zinc-800 flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={PROVIDER_ICONS.gmail}
                              alt="Gmail"
                              className="w-6 h-6"
                            />
                            <div>
                              <h3 className="font-medium text-white text-lg">
                                Gmail Smart Labels
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Auto-categorize emails with AI
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={emailLabelingEnabled}
                              onCheckedChange={handleEmailLabelToggle}
                              className={emailLabelingEnabled ? "bg-[#9334E9]" : ""}
                            />
                            {gmailPermissionError && (
                              <Button
                                variant="outline"
                                className="bg-amber-900 text-amber-100 hover:bg-amber-800 border-amber-700 min-w-[100px]"
                                onClick={handleReconnectGoogle}
                              >
                                Reconnect Google
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {/* Status messages */}
                        {processedEmailCount > 0 && (
                          <p className="text-sm text-green-500 mt-2">
                            Successfully processed {processedEmailCount} emails
                          </p>
                        )}
                        {gmailPermissionError && (
                          <p className="text-sm text-amber-500 mt-2">
                            Additional Gmail permissions are required. Please reconnect your Google account.
                          </p>
                        )}
                        {emailLabelingEnabled && !gmailPermissionError && (
                          <p className="text-xs text-zinc-400 mt-2">
                            Uses AI to categorize your unread emails (max 10) and apply labels in Gmail
                          </p>
                        )}
                        
                        {/* Prominent Process Emails button */}
                        {emailLabelingEnabled && !gmailPermissionError && (
                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:border-[#9334E9] border border-zinc-700 min-w-[140px] px-4 py-2"
                              onClick={processGmailLabels}
                              disabled={isProcessingEmails}
                            >
                              {isProcessingEmails ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9334E9] mr-2"></div>
                                  Processing...
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <img
                                    src={PROVIDER_ICONS.gmail}
                                    alt="Gmail"
                                    className="w-4 h-4 mr-2"
                                  />
                                  Process Emails
                                </div>
                              )}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "account" && (
            <>
              <div className="flex-1 space-y-8">
                <h1 className="text-2xl font-medium text-white">Account</h1>

                <Card className="bg-black border-zinc-800">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-md text-zinc-400">Email</h3>
                          <p className="text-white">{userEmail}</p>
                        </div>
                        <div>
                          <h3 className="text-md text-zinc-400">
                            With us since
                          </h3>
                          <p className="text-white">{createdAt}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-md font-medium text-white">
                              Email Notifications
                            </h3>
                            <p className="text-sm text-zinc-400">
                              Receive meeting summaries after each call
                            </p>
                          </div>
                          <Switch
                            checked={emailNotificationsEnabled}
                            onCheckedChange={handleEmailNotificationsToggle}
                            className={
                              emailNotificationsEnabled ? "bg-[#9334E9]" : ""
                            }
                          />
                        </div>
                      </div>

                      <div className="pt">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-md font-medium text-white">
                              Sign Out
                            </h3>
                            <p className="text-sm text-zinc-400">
                              Sign out of your account
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="text-sm bg-zinc-800 hover:bg-red-500 text-white whitespace-nowrap flex items-center mt-auto w-fit group"
                            onClick={initiateLogout}
                          >
                            <LogOut className="w-5 h-5 text-red-500 mr-2 group-hover:text-white" />
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          {activeTab === "team" && (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-medium text-white">
                  Team Settings
                </h1>

                <Card className="bg-black border-zinc-800">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-md text-zinc-400">Team Name</h3>
                            {editingField === "name" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSave("name")}
                                  className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-zinc-800 text-white hover:bg-zinc-700"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave("name")}
                                  className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] hover:!bg-[#3c1671]"
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setEditingField("name")}
                                className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:!bg-[#3c1671] hover:border-[#6D28D9]"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {editingField === "name" ? (
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#9334E9] focus:border-transparent"
                            />
                          ) : (
                            <p className="text-white">{teamName}</p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <h3 className="text-md text-zinc-400">Location</h3>
                            {editingField === "location" ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSave("location")}
                                  className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-zinc-800 text-white hover:bg-zinc-700"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave("location")}
                                  className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] hover:!bg-[#3c1671]"
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setEditingField("location")}
                                className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:!bg-[#3c1671] hover:border-[#6D28D9]"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          {editingField === "location" ? (
                            <input
                              type="text"
                              value={editedLocation}
                              onChange={(e) =>
                                setEditedLocation(e.target.value)
                              }
                              className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#9334E9] focus:border-transparent"
                            />
                          ) : (
                            <p className="text-white">{teamLocation}</p>
                          )}
                        </div>

                        <div>
                          <h3 className="text-md text-zinc-400">
                            Created Date
                          </h3>
                          <p className="text-white">{teamCreatedAt}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8 mt-8 border-t border-zinc-800 pt-8">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-medium text-white">Members</h1>
                  <Button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:!bg-[#3c1671] hover:border-[#6D28D9]"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Members
                  </Button>
                </div>

                <Card className="bg-black border-zinc-800">
                  <CardContent className="p-6">
                    {membersLoading ? (
                      <div className="text-zinc-400">Loading members...</div>
                    ) : teamMembers.length === 0 ? (
                      <div className="text-zinc-400">No members found</div>
                    ) : (
                      <div className="space-y-6">
                        {teamMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center gap-4">
                              <div className="bg-zinc-800 rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium text-[#a774ee] border border-[#a774ee]">
                                {getInitials(member.name, member.users?.email)}
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  {member.name || member.users?.email}{" "}
                                  <b>({member.users?.email || member.name})</b>
                                </p>
                                <div className="flex items-center gap-2 text-sm text-zinc-400">
                                  {editingMemberId === member.id ? (
                                    <select
                                      value={editedRole}
                                      onChange={(e) =>
                                        setEditedRole(e.target.value)
                                      }
                                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white"
                                    >
                                      <option value="owner">Owner</option>
                                      <option value="member">Member</option>
                                    </select>
                                  ) : (
                                    <span className="capitalize">
                                      {member.role}
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span>
                                    Joined{" "}
                                    {new Date(
                                      member.created_at
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {currentUserRole === "owner" && (
                              <div className="flex gap-2">
                                {editingMemberId === member.id ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => setEditingMemberId(null)}
                                      className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-zinc-800 text-white hover:bg-zinc-700"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleRoleUpdate(member.id)
                                      }
                                      className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] hover:!bg-[#3c1671]"
                                    >
                                      Save
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setEditingMemberId(member.id);
                                      setEditedRole(member.role);
                                    }}
                                    className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] hover:!bg-[#3c1671]"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit Role
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === "feedback" && (
            <div className="space-y-10">
              <h1 className="text-2xl font-medium text-white">Feedback</h1>

              <Card className="bg-black border-zinc-800">
                <CardContent className="p-6">
                  {/* Report an issue */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-md font-semibold flex items-center gap-2 text-white">
                          Encounter an issue?
                        </h2>
                        <p className="text-sm text-zinc-400">
                          Help us improve by reporting issues
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white whitespace-nowrap flex items-center"
                        onClick={() =>
                          window.open(
                            "https://github.com/thepersonalaicompany/amurex-web/issues/new",
                            "_blank"
                          )
                        }
                      >
                        <Github className="w-5 h-5 text-[#9334E9] mr-2" />
                        Report Issue
                      </Button>
                    </div>

                    {/* Book a call */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-md font-semibold flex items-center gap-2 text-white">
                          Want to give us feedback?
                        </h2>
                        <p className="text-sm text-zinc-400">
                          Book a call with us to talk about your experience
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white whitespace-nowrap flex items-center"
                        onClick={() =>
                          window.open(
                            "https://cal.com/founders-the-personal-ai-company/15min",
                            "_blank"
                          )
                        }
                      >
                        <Calendar className="w-5 h-5 text-[#9334E9] mr-2" />
                        Book a call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {showSignOutConfirm && (
        <div className="px-2 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20">
            <h3 className="lg:text-xl text-md font-medium mb-4 text-white">
              Confirm Sign Out
            </h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-md font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                onClick={() => setShowSignOutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-md font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="px-2 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20">
            <h2 className="lg:text-xl text-md font-medium mb-4 text-white">
              Invite members to <b>{teamName}</b>
            </h2>

            <div className="mt-4">
              <p className="text-white lg:text-md text-sm font-semibold">
                Send invites via email
              </p>
              <div className="flex items-center">
                <input
                  type="text"
                  value={emailInput}
                  onChange={handleEmailInputChange}
                  onKeyDown={isMobile ? undefined : handleEmailInputKeyDown}
                  placeholder={
                    isMobile ? "Enter emails" : "Enter emails and press enter"
                  }
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
                  <li className="font-semibold lg:text-md text-sm">
                    New invites
                  </li>
                  {emails.map((email, index) => (
                    <li
                      key={index}
                      className="lg:text-md text-sm bg-[#27272A] p-2 rounded mt-1 flex justify-between items-center w-min"
                    >
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
                onClick={sendInvites}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-send"
                >
                  <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                  <path d="m21.854 2.147-10.94 10.939" />
                </svg>
                <span>Send Invites</span>
              </button>
            </div>

            <div className="mt-6">
              <p className="text-white lg:text-md text-sm font-semibold">
                Or copy the invite URL
              </p>
              <input
                type="text"
                value={`${window.location.host}/teams/join/${teamInviteCode}`}
                readOnly
                className="w-full mt-2 p-2 border rounded bg-transparent text-white lg:text-md text-sm"
              />
              <button
                className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                onClick={handleCopyInviteLink}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 4V16C8 17.1046 8.89543 18 10 18H18C19.1046 18 20 17.1046 20 16V7.24853C20 6.77534 19.7893 6.32459 19.4142 6.00001L16.9983 3.75735C16.6232 3.43277 16.1725 3.22205 15.6993 3.22205H10C8.89543 3.22205 8 4.11748 8 5.22205"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 4V7H19"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4 8V20C4 21.1046 4.89543 22 6 22H14C15.1046 22 16 21.1046 16 20"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{copyButtonText}</span>
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-md font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                onClick={() => setIsInviteModalOpen(false)}
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isObsidianModalOpen && (
        <div className="px-2 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20 max-w-lg w-full">
            <h2 className="text-xl font-medium mb-4 text-white">
              Upload Markdown Files
            </h2>

            <div className="mt-4">
              <input
                type="file"
                multiple
                accept=".md"
                onChange={handleFileSelect}
                className="hidden"
                id="markdown-upload"
              />
              <label
                htmlFor="markdown-upload"
                className="cursor-pointer flex items-center justify-center w-full p-4 border-2 border-dashed border-zinc-700 rounded-lg hover:border-[#9334E9] transition-colors"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <FileText className="w-8 h-8 text-[#9334E9] mx-auto mb-2" />
                  <p className="text-white">Click to select markdown files</p>
                  <p className="text-sm text-zinc-400">
                    or drag and drop them here
                  </p>
                </div>
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-white font-medium mb-2">
                    Selected Files:
                  </h3>
                  <ul className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="text-zinc-400 flex items-center"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isUploading && (
                <div className="mt-4">
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#9334E9] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-zinc-400 text-sm mt-2 text-center">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsObsidianModalOpen(false);
                    setSelectedFiles([]);
                  }}
                  className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleObsidianUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:!bg-[#3c1671] hover:border-[#6D28D9]"
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
