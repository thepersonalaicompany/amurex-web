"use client";

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function OmiCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const handleOmiCallback = async () => {
      try {
        // Get the authenticated user
        console.log("Getting authenticated user");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Session data:", session);
        if (!session?.user?.id) {
          return NextResponse.json(
            {
              success: false,
              error: "Unauthorized",
            },
            { status: 401 }
          );
        }

        // Get the URL parameters
        const omi_uid = searchParams.get("uid");

        if (!omi_uid) {
          return NextResponse.json(
            {
              success: false,
              error: "Missing OMI user ID",
            },
            { status: 400 }
          );
        }

        // Update the user in Supabase
        const { data, error } = await supabase
          .from("users")
          .update({
            omi_connected: true,
            omi_uid: omi_uid,
          })
          .eq("id", session.user.id)
          .select();

        if (error) {
          console.error("Error updating user:", error);
          return NextResponse.json(
            {
              success: false,
              error: error.message,
            },
            { status: 500 }
          );
        }

        console.log("User OMI connection updated successfully");

        // Trigger initial export of user's data to OMI
        try {
          console.log("Triggering initial OMI export...");
          const response = await fetch("/api/omi/trigger-initial-export", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: session.user.id,
            }),
          });

          if (response.ok) {
            console.log("Initial OMI export triggered successfully");
          } else {
            console.error(
              "Failed to trigger initial OMI export:",
              response.status
            );
          }
        } catch (exportError) {
          console.error("Error triggering initial OMI export:", exportError);
          // Don't fail the callback flow if export fails
        }

        router.push("/settings");
      } catch (error) {
        console.error("Error in OMI route:", error);
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 500 }
        );
      }
    };

    handleOmiCallback();
  }, [router, searchParams]);

  return (
    <div>
      <h1>Omi Callback</h1>
    </div>
  );
}

export default function OmiCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OmiCallback />
    </Suspense>
  );
}
