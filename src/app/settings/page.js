"use client";

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import IconToggle from "@/components/ui/IconToggle";
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
  Clock,
} from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import MobileWarningBanner from "@/components/MobileWarningBanner";

const PROVIDER_ICONS = {
  google:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png",
  notion:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Notion-logo.svg/2048px-Notion-logo.svg.png",
  obsidian: "https://obsidian.md/images/obsidian-logo-gradient.svg",
  gmail:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png",
  omi: "/omilogo.webp",
};

const BASE_URL_BACKEND = "https://api.amurex.ai";

function SettingsContent() {
  const [activeTab, setActiveTab] = useState("personalization");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [notionConnected, setNotionConnected] = useState(false);
  const [omiConnected, setOmiConnected] = useState(false);
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
  const [showBroaderAccessModal, setShowBroaderAccessModal] = useState(false);
  const [googleTokenVersion, setGoogleTokenVersion] = useState(null);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Define importGoogleDocs and other functions before using them in useEffect
  const importGoogleDocs = useCallback(async () => {
    // Only proceed if we have full access
    if (googleTokenVersion !== "full") {
      console.log("Skipping Google Docs import - no full access");
      toast.error("Google Docs import requires full access permissions");
      return;
    }

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
  }, [googleTokenVersion]); // Add googleTokenVersion as a dependency

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
          maxEmails: 20,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProcessedEmailCount(data.processed || 0);
        toast.success(`Successfully processed ${data.processed} emails`);
      } else {
        if (data.errorType === "insufficient_permissions") {
          setGmailPermissionError(true);
          toast.error(
            "Insufficient Gmail permissions. Please reconnect your Google account."
          );
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

  // Update the useEffect for session checking
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          setUserId(session.user.id);
          // Fetch user data and integrations
          await checkIntegrations();

          // Fetch Google token version
          const { data, error: tokenError } = await supabase
            .from("users")
            .select("google_token_version")
            .eq("id", session.user.id)
            .single();

          if (!tokenError && data) {
            setGoogleTokenVersion(data.google_token_version);
            setGoogleDocsConnected(data.google_token_version === "full");
            setGmailConnected(
              data.google_token_version === "full" ||
                data.google_token_version === "gmail_only"
            );
          }
        } else {
          // Redirect if no session
          const currentPath = window.location.pathname + window.location.search;
          const encodedRedirect = encodeURIComponent(currentPath);
          router.push(`/web_app/signin?redirect=${encodedRedirect}`);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    checkSession();

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

  // Move checkIntegrations function above the useEffect
  const checkIntegrations = async () => {
    try {
      console.log("Checking integrations...");
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (session) {
        console.log("Session found, fetching user data");
        const { data: user, error } = await supabase
          .from("users")
          .select(
            "notion_connected, google_docs_connected, omi_connected, calendar_connected, memory_enabled, email, created_at, email_tagging_enabled, emails_enabled"
          )
          .eq("id", session.user.id)
          .single();
        console.log("User data:", user);

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
          setOmiConnected(user.omi_connected);
          setGoogleDocsConnected(user.google_docs_connected);
          console.log(
            "Setting googleDocsConnected to:",
            user.google_docs_connected
          );
          setCalendarConnected(user.calendar_connected);
          setMemoryEnabled(user.memory_enabled);
          setEmailLabelingEnabled(user.email_tagging_enabled || false);
          setEmailNotificationsEnabled(user.emails_enabled || false);
        }
      }
      return true;
    } catch (error) {
      console.error("Error checking integrations:", error);
      return false;
    }
  };

  // Now the useEffect can reference checkIntegrations
  useEffect(() => {
    const connection = searchParams.get("connection");
    const source = searchParams.get("source");

    console.log("Detected URL params:", { connection, source });

    if (connection === "success") {
      console.log("Connection successful, triggering appropriate action");

      // Force a check of integrations first to ensure we have the latest status
      checkIntegrations().then(() => {
        // Handle based on the source parameter
        if (source === "gmail") {
          console.log("Gmail connection detected, processing emails");
          toast.success("Gmail connected successfully!");
          processGmailLabels();
          // Redirect to search page after Gmail connection
          router.push("/search");
        } else if (source === "notion") {
          console.log("Notion connection detected, importing documents");
          toast.success("Notion connected successfully!");
          importNotionDocuments();
          // Redirect to search page after Notion connection
          router.push("/search");
        } else {
          // Only import Google Docs if we have full access
          if (googleTokenVersion === "full") {
            console.log("Google Docs connection detected, importing documents");
            toast.success("Google Docs connected successfully!");
            importGoogleDocs();
            // Redirect to search page after Google Docs connection
            router.push("/search");
          } else {
            console.log(
              "Google connection detected, but no full access for Docs"
            );
            toast.success("Google account connected successfully!");
            // Redirect to search page even without full access
            router.push("/search");
          }
        }
      });
    }
  }, [
    searchParams,
    googleTokenVersion,
    importGoogleDocs,
    importNotionDocuments,
    processGmailLabels,
    router,
  ]);

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

  const connectNotion = async () => {
    try {
      const response = await fetch("/api/notion/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ source: "settings" }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to get Notion authorization URL");
      }
    } catch (error) {
      console.error("Error connecting to Notion:", error);
      toast.error("Failed to connect to Notion");
    }
  };

  const connectOmi = async () => {
    try {
      // Your app ID from OMI platform registration
      const APP_ID = "01JWF84YVZ6SYKE486KWARA2CK";

      // Generate a random state string to prevent CSRF attacks
      const state = Math.random().toString(36).substring(7);

      // Store state in localStorage to verify on callback
      localStorage.setItem("omiOAuthState", state);

      // Construct the authorization URL
      const authUrl = new URL("https://api.omi.me/v1/oauth/authorize");
      // we should potentially store this in the database as well.
      authUrl.searchParams.append("app_id", APP_ID);
      authUrl.searchParams.append("state", state);

      // Redirect user to OMI authorization page
      window.location.href = authUrl.toString();
    } catch (error) {
      console.error("Error initiating OMI OAuth flow:", error);
      toast.error("Failed to connect to OMI");
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
        toast.success(
          checked
            ? "Email notifications enabled"
            : "Email notifications disabled"
        );
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
        toast.success(
          checked ? "Email labeling enabled" : "Email labeling disabled"
        );
      }
    } catch (error) {
      console.error("Error updating email labeling settings:", error);
      toast.error("Failed to update email labeling settings");
    }
  };

  // Add useEffect to get and store userId
  useEffect(() => {
    const fetchUserId = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session && session.user) {
        setUserId(session.user.id);
      }
    };

    fetchUserId();
  }, []);

  // Update the handleGoogleDocsConnect function to use userId from state
  const handleGoogleDocsConnect = async () => {
    try {
      if (!userId) {
        toast.error("You must be logged in to connect Google Docs");
        return;
      }

      setIsImporting(true);
      setImportSource("Google Docs");

      const response = await fetch("/api/google/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          clientId: 2, // Always use client ID 2
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Store a flag to indicate we want to import after connection
        localStorage.setItem("pendingGoogleDocsImport", "true");
        window.location.href = data.url;
      } else {
        throw new Error("Failed to get Google auth URL");
      }
    } catch (error) {
      console.error("Error connecting Google Docs:", error);
      toast.error("Failed to connect Google Docs");
      setIsImporting(false);
      setImportSource("");
    }
  };

  // Update the return statement to use the imported component
  return (
    <div className="flex min-h-screen bg-black text-white">
      <MobileWarningBanner />

      {/* Main Settings Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Settings Sidebar */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-zinc-800 bg-black p-4">
          <h2 className="mb-6 text-2xl font-medium text-white">Settings</h2>
          <div className="text-md space-y-2">
            <button
              onClick={() => handleTabChange("personalization")}
              className={`w-full rounded-lg px-4 py-2 text-left ${
                activeTab === "personalization"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Personalization
            </button>
            <button
              onClick={() => handleTabChange("account")}
              className={`w-full rounded-lg px-4 py-2 text-left ${
                activeTab === "account"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Account
            </button>
            <button
              onClick={() => handleTabChange("team")}
              className={`hidden w-full rounded-lg px-4 py-2 text-left ${
                activeTab === "team"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Team
            </button>
            <button
              onClick={() => handleTabChange("feedback")}
              className={`w-full rounded-lg px-4 py-2 text-left ${
                activeTab === "feedback"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              Feedback
            </button>
          </div>
        </div>

        {/* Warning Modal */}
        {showWarningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6">
              <h3 className="mb-4 text-xl font-medium text-white">
                Your data is safe
              </h3>
              <p className="mb-6 text-zinc-300">
                Since the app is still in Google&apos;s review process, you will
                be warned that the app is unsafe.
                <br />
                <br />
                You can safely proceed by clicking on &quot;Advanced&quot; and
                then &quot;Go to Amurex (unsafe)&quot;.
              </p>
              <p className="mb-6 text-zinc-300">
                We ensure that the app is safe to use and your data{" "}
                <span className="font-bold underline">
                  <a
                    href="https://github.com/thepersonalaicompany/amurex-web"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    is secure
                  </a>
                </span>
                .
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    handleGoogleDocsConnect();
                  }}
                  className="rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-black p-8">
          <div className="mb-4 space-y-4">
            <div className="relative">
              <div className="absolute -inset-0.5 animate-gradient-x rounded-lg bg-gradient-to-r from-[#9334E9] to-[#9334E9] opacity-75 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
              <Card className="relative overflow-hidden border-zinc-500 bg-black">
                <div className="absolute inset-0 animate-pulse bg-[#9334E9]/20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#9334E9]/30 via-[#9334E9]/20 to-[#9334E9]/30"></div>
                <CardContent className="relative p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <MessageSquare className="h-6 w-6 text-[#9334E9]" />
                      <div>
                        <h3 className="text-lg font-medium text-white">
                          Knowledge Search (new!)
                        </h3>
                        <p className="text-sm text-zinc-400">
                          Try our new feature - search your emails, documents,
                          notes, and more
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -inset-0.5 animate-gradient-x rounded-lg bg-gradient-to-r from-[#9334E9] to-[#9334E9] opacity-75 blur transition duration-1000 group-hover:opacity-100 group-hover:duration-200"></div>
                      <Button
                        variant="outline"
                        className="relative rounded-md border border-zinc-800 bg-zinc-900/50 text-zinc-300 backdrop-blur-sm transition-colors duration-200 hover:border-[#9334E9] hover:bg-zinc-800"
                        onClick={async () => {
                          // Track button click with analytics
                          try {
                            // Log the user action for analytics using stored userId
                            await logUserAction(
                              userId || "not-required", // Use userId if available, fallback to "not-required"
                              "web_memory_chat_tried"
                            );

                            // Navigate to chat page
                            router.push("/search");
                          } catch (error) {
                            console.error("Analytics error:", error);
                            // Still navigate even if analytics fails
                            router.push("/search");
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
              <Card className="border-zinc-800 bg-black">
                <CardContent className="space-y-6 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <Cloud className="h-5 w-5 text-[#9334E9]" />
                        Memory
                      </h2>
                      <p className="text-sm text-zinc-400">
                        Enable memory storing to unlock our{" "}
                        <b>AI-powered knowledge search feature</b>, allowing you
                        to have intelligent conversations about your past
                        meetings, emails, documents, and more
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconToggle
                        checked={memoryEnabled}
                        onChange={handleMemoryToggle}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Card className="flex-1 border-zinc-800 bg-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={PROVIDER_ICONS.gmail}
                              alt="Google"
                              className="w-6"
                            />
                            <div>
                              <h3 className="text-lg font-medium text-white">
                                Connect Gmail
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Sync your Gmail inbox
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className={`border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 ${
                              googleDocsConnected
                                ? "bg-green-900 hover:bg-green-800"
                                : ""
                            } min-w-[100px]`}
                            onClick={() => {
                              router.push("/emails");
                            }}
                          >
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="flex-1 border-zinc-800 bg-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={PROVIDER_ICONS.notion}
                              alt="Notion"
                              className="h-6 w-6"
                            />
                            <div>
                              <h3 className="text-lg font-medium text-white">
                                Connect Notion
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Sync your Notion pages
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className={`border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 ${
                              notionConnected
                                ? "bg-green-900 hover:bg-green-800"
                                : ""
                            } min-w-[100px]`}
                            onClick={connectNotion}
                            disabled={isImporting && importSource === "Notion"}
                          >
                            {isImporting && importSource === "Notion" ? (
                              <div className="flex items-center">
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-[#9334E9]"></div>
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
                    <Card className="flex-1 border-zinc-800 bg-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={PROVIDER_ICONS.obsidian}
                              alt="Obsidian"
                              className="h-6 w-6"
                            />
                            <div>
                              <h3 className="text-lg font-medium text-white">
                                Upload from Obsidian
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Import your markdown files
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="min-w-[100px] border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => setIsObsidianModalOpen(true)}
                          >
                            Upload
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="flex-1 border-zinc-800 bg-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={PROVIDER_ICONS.omi}
                              alt="Omi"
                              className="w-8"
                            />
                            <div>
                              <h3 className="text-lg font-medium text-white">
                                Connect Omi
                              </h3>
                              <p className="text-sm text-zinc-400">
                                A two way connection to and from your Omi
                                memories.
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className={`border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 ${
                              omiConnected
                                ? "bg-green-900 hover:bg-green-800"
                                : ""
                            } min-w-[100px]`}
                            onClick={connectOmi}
                            // disabled={isImporting && importSource === "Omi"}
                          >
                            {isImporting && importSource === "Omi" ? (
                              <div className="flex items-center">
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-[#9334E9]"></div>
                                Importing...
                              </div>
                            ) : omiConnected ? (
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
                    <Card className="flex-1 border-zinc-800 bg-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800">
                              <Plus className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-white">
                                Request Integration
                              </h3>
                              <p className="text-sm text-zinc-400">
                                Suggest the next integration
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="min-w-[100px] border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
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

                  <div className="mt-4 flex hidden gap-4">
                    <Card className="flex-1 border-zinc-800 bg-black">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={PROVIDER_ICONS.gmail}
                              alt="Gmail"
                              className="w-6"
                            />
                            <div>
                              <h3 className="text-lg font-medium text-white">
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
                              className={
                                emailLabelingEnabled ? "bg-[#9334E9]" : ""
                              }
                            />
                            {gmailPermissionError && (
                              <Button
                                variant="outline"
                                className="min-w-[100px] border-amber-700 bg-amber-900 text-amber-100 hover:bg-amber-800"
                                onClick={handleReconnectGoogle}
                              >
                                Reconnect Google
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Status messages */}
                        {processedEmailCount > 0 && (
                          <p className="mt-2 text-sm text-green-500">
                            Successfully processed {processedEmailCount} emails
                          </p>
                        )}
                        {gmailPermissionError && (
                          <p className="mt-2 text-sm text-amber-500">
                            Additional Gmail permissions are required. Please
                            reconnect your Google account.
                          </p>
                        )}
                        {emailLabelingEnabled && !gmailPermissionError && (
                          <p className="mt-2 text-xs text-zinc-400">
                            Uses AI to categorize your unread emails (max 10)
                            and apply labels in Gmail
                          </p>
                        )}

                        {/* Prominent Process Emails button */}
                        {emailLabelingEnabled && !gmailPermissionError && (
                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              className="min-w-[140px] border border-zinc-700 bg-zinc-900 px-4 py-2 text-zinc-300 hover:border-[#9334E9] hover:bg-zinc-800"
                              onClick={processGmailLabels}
                              disabled={isProcessingEmails}
                            >
                              {isProcessingEmails ? (
                                <div className="flex items-center">
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-[#9334E9]"></div>
                                  Processing...
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <img
                                    src={PROVIDER_ICONS.gmail}
                                    alt="Gmail"
                                    className="mr-2 w-4"
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

                <Card className="border-zinc-800 bg-black">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-md text-zinc-400">Email</h3>
                          <p className="text-white">{userEmail}</p>
                        </div>
                        <div>
                          <div className="text-md group relative inline-flex animate-pulse-slow items-center overflow-hidden rounded-full border border-[#9334E9]/50 bg-gradient-to-r from-[#9334E9]/60 to-[#9334E9]/40 px-2.5 py-1 font-medium text-[#e0c5f9] shadow-[0_0_12px_rgba(147,52,233,0.45)]">
                            <span className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[#9334E9]/40 to-transparent"></span>
                            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#9334E9]/20 via-[#9334E9]/50 to-[#9334E9]/20 opacity-0 blur-sm transition-opacity duration-700 group-hover:opacity-100"></div>
                            <Clock className="mr-1 h-3 w-3" />
                            With us since
                          </div>
                          <p className="mt-1 text-white">{createdAt}</p>
                        </div>
                      </div>

                      <div className="border-t border-zinc-800 pt-2">
                        <div className="flex hidden items-center justify-between">
                          <div>
                            <h3 className="text-md font-medium text-white">
                              Email Notifications
                            </h3>
                            <p className="text-sm text-zinc-400">
                              Receive meeting summaries after each call
                            </p>
                          </div>
                          <IconToggle
                            checked={emailNotificationsEnabled}
                            onChange={handleEmailNotificationsToggle}
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
                            className="group mt-auto flex w-fit items-center whitespace-nowrap bg-zinc-800 text-sm text-white hover:bg-red-500"
                            onClick={initiateLogout}
                          >
                            <LogOut className="mr-2 h-5 w-5 text-red-500 group-hover:text-white" />
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

                <Card className="border-zinc-800 bg-black">
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
                                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-zinc-800 px-2 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave("name")}
                                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-white/10 !bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] hover:!bg-[#3c1671]"
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setEditingField("name")}
                                className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 !bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:!bg-[#3c1671] lg:px-4 lg:py-2"
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
                              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9334E9]"
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
                                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-zinc-800 px-2 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave("location")}
                                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-white/10 !bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] hover:!bg-[#3c1671]"
                                >
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setEditingField("location")}
                                className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 !bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:!bg-[#3c1671] lg:px-4 lg:py-2"
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
                              className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-white focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#9334E9]"
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

              <div className="mt-8 space-y-8 border-t border-zinc-800 pt-8">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-medium text-white">Members</h1>
                  <Button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 !bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:!bg-[#3c1671] lg:px-4 lg:py-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invite Members
                  </Button>
                </div>

                <Card className="border-zinc-800 bg-black">
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
                              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#a774ee] bg-zinc-800 text-sm font-medium text-[#a774ee]">
                                {getInitials(member.name, member.users?.email)}
                              </div>
                              <div>
                                <p className="font-medium text-white">
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
                                      className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-white"
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
                                      className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-white/10 bg-zinc-800 px-2 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleRoleUpdate(member.id)
                                      }
                                      className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-white/10 !bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] hover:!bg-[#3c1671]"
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
                                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-md border border-white/10 !bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] hover:!bg-[#3c1671]"
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

              <Card className="border-zinc-800 bg-black">
                <CardContent className="p-6">
                  {/* Report an issue */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-md flex items-center gap-2 font-semibold text-white">
                          Encounter an issue?
                        </h2>
                        <p className="text-sm text-zinc-400">
                          Help us improve by reporting issues
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="flex items-center whitespace-nowrap bg-zinc-800 text-white hover:bg-zinc-700"
                        onClick={() =>
                          window.open(
                            "https://github.com/thepersonalaicompany/amurex-web/issues/new",
                            "_blank"
                          )
                        }
                      >
                        <Github className="mr-2 h-5 w-5 text-[#9334E9]" />
                        Report Issue
                      </Button>
                    </div>

                    {/* Book a call */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h2 className="text-md flex items-center gap-2 font-semibold text-white">
                          Want to give us feedback?
                        </h2>
                        <p className="text-sm text-zinc-400">
                          Book a call with us to talk about your experience
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="flex items-center whitespace-nowrap bg-zinc-800 text-white hover:bg-zinc-700"
                        onClick={() =>
                          window.open(
                            "https://cal.com/founders-the-personal-ai-company/15min",
                            "_blank"
                          )
                        }
                      >
                        <Calendar className="mr-2 h-5 w-5 text-[#9334E9]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-2">
          <div className="rounded-lg border border-white/20 bg-black bg-opacity-40 p-8 shadow-lg backdrop-blur-sm">
            <h3 className="text-md mb-4 font-medium text-white lg:text-xl">
              Confirm Sign Out
            </h3>
            <p className="mb-6 text-zinc-400">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="text-md inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 px-4 py-2 font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671]"
                onClick={() => setShowSignOutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="text-md inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#9334E9] px-4 py-2 font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671]"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-2">
          <div className="rounded-lg border border-white/20 bg-black bg-opacity-40 p-8 shadow-lg backdrop-blur-sm">
            <h2 className="text-md mb-4 font-medium text-white lg:text-xl">
              Invite members to <b>{teamName}</b>
            </h2>

            <div className="mt-4">
              <p className="lg:text-md text-sm font-semibold text-white">
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
                  className="lg:text-md mt-2 w-full rounded border bg-transparent p-2 text-sm text-white"
                />
                {isMobile && (
                  <button
                    onClick={addEmail}
                    className="ml-2 mt-2 rounded bg-[#9334E9] p-2 text-white"
                  >
                    <Plus />
                  </button>
                )}
              </div>

              {emails.length > 0 && (
                <ul className="mt-2 text-white">
                  <li className="lg:text-md text-sm font-semibold">
                    New invites
                  </li>
                  {emails.map((email, index) => (
                    <li
                      key={index}
                      className="lg:text-md mt-1 flex w-min items-center justify-between rounded bg-[#27272A] p-2 text-sm"
                    >
                      {email}
                      <button
                        onClick={() => removeEmail(index)}
                        className="ml-2 rounded bg-[#9334E9] p-1 text-white"
                      >
                        <Minus />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671] lg:px-4 lg:py-2"
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
              <p className="lg:text-md text-sm font-semibold text-white">
                Or copy the invite URL
              </p>
              <input
                type="text"
                value={`${window.location.host}/teams/join/${teamInviteCode}`}
                readOnly
                className="lg:text-md mt-2 w-full rounded border bg-transparent p-2 text-sm text-white"
              />
              <button
                className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671] lg:px-4 lg:py-2"
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

            <div className="mt-6 flex justify-end">
              <button
                className="text-md inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 px-4 py-2 font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671]"
                onClick={() => setIsInviteModalOpen(false)}
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {isObsidianModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-2">
          <div className="w-full max-w-lg rounded-lg border border-white/20 bg-black bg-opacity-40 p-8 shadow-lg backdrop-blur-sm">
            <h2 className="mb-4 text-xl font-medium text-white">
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
                className="flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 p-4 transition-colors hover:border-[#9334E9]"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-[#9334E9]" />
                  <p className="text-white">Click to select markdown files</p>
                  <p className="text-sm text-zinc-400">
                    or drag and drop them here
                  </p>
                </div>
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="mb-2 font-medium text-white">
                    Selected Files:
                  </h3>
                  <ul className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <li
                        key={index}
                        className="flex items-center text-zinc-400"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isUploading && (
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-[#9334E9] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-center text-sm text-zinc-400">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsObsidianModalOpen(false);
                    setSelectedFiles([]);
                  }}
                  className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-white/10 px-2 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671] lg:px-4 lg:py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleObsidianUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-white/10 !bg-[#9334E9] px-2 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:!bg-[#3c1671] lg:px-4 lg:py-2"
                >
                  Upload Files
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBroaderAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="mb-4 text-xl font-medium text-white">
              Broader Google Access Required
            </h3>
            <p className="mb-6 text-zinc-300">
              We need broader access to your Google account to enable Google
              Docs integration. The app is still in the verification process
              from Google.
            </p>
            <p className="mb-6 text-zinc-300">
              If you wish to proceed, you can continue with the authentication
              process.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowBroaderAccessModal(false)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowBroaderAccessModal(false);
                  window.location.href = "/api/google/auth";
                }}
                className="rounded-lg bg-[#9334E9] px-4 py-2 text-white transition-colors hover:bg-[#7928CA]"
              >
                Continue
              </button>
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
