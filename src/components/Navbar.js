"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Video,
  Compass,
  Bell,
  Mail,
  Settings,
  Plus,
  Brain,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export function Navbar() {
  console.log("navbar!");
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) return null;

  // Check if a path is active
  const isActive = (path) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      className="z-50 hidden h-full w-16 flex-col items-center justify-between border-r border-zinc-800 py-4 shadow-md lg:flex"
      style={{ backgroundColor: "black" }}
    >
      <span
        className="cursor-pointer text-4xl"
        role="img"
        aria-label="Amurex logo"
        onClick={() => router.push("/search")}
      >
        <img
          src="/amurex.png"
          alt="Amurex logo"
          className="h-10 w-10 rounded-full border-2 border-black transition-colors hover:border-[#6D28D9]"
          style={{ color: "var(--color-4)" }}
        />
      </span>
      <div className="mb-4 flex flex-col items-center space-y-8">
        <div className="group relative">
          <Button
            variant={isActive("/search") ? "active-navbar" : "navbar"}
            size="icon"
            onClick={() => router.push("/search")}
            className={
              isActive("/search") ? "border border-[#6D28D9] bg-[#3c1671]" : ""
            }
          >
            {/* <Search className="h-6 w-6" style={{ color: "var(--color-4)", strokeWidth: "2.5" }} /> */}
            <Search
              className="h-6 w-6"
              style={{
                color: "oklch(55.2% 0.016 285.938)",
                strokeWidth: "2.5",
              }}
            />
          </Button>
          <span className="absolute left-12 top-1/2 -translate-y-1/2 transform text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Search
          </span>
        </div>
        <div className="group relative">
          <Button
            variant={isActive("/meetings") ? "active-navbar" : "navbar"}
            size="icon"
            onClick={() => router.push("/meetings")}
            className={
              isActive("/meetings")
                ? "border border-[#6D28D9] bg-[#3c1671]"
                : ""
            }
          >
            <Video
              className="h-6 w-6"
              style={{ color: "oklch(55.2% 0.016 285.938)" }}
            />
          </Button>
          <span className="absolute left-12 top-1/2 -translate-y-1/2 transform text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Meetings
          </span>
        </div>
        <div className="group relative">
          <Button
            variant={isActive("/emails") ? "active-navbar" : "navbar"}
            size="icon"
            onClick={() => router.push("/emails")}
            className={
              isActive("/emails") ? "border border-[#6D28D9] bg-[#3c1671]" : ""
            }
          >
            <Mail
              className="h-6 w-6"
              style={{ color: "oklch(55.2% 0.016 285.938)" }}
            />
          </Button>
          <span className="absolute left-12 top-1/2 -translate-y-1/2 transform text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Emails
          </span>
        </div>
        <div className="group relative">
          <Button
            variant={isActive("/settings") ? "active-navbar" : "navbar"}
            size="icon"
            onClick={() => router.push("/settings?tab=personalization")}
            className={
              isActive("/settings")
                ? "border border-[#6D28D9] bg-[#3c1671]"
                : ""
            }
          >
            <Settings
              className="h-6 w-6"
              style={{ color: "oklch(55.2% 0.016 285.938)" }}
            />
          </Button>
          <span className="absolute left-12 top-1/2 -translate-y-1/2 transform text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Settings
          </span>
        </div>
      </div>
    </aside>
  );
}
