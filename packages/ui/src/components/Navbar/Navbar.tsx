"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Video, Mail, Settings, Search } from "lucide-react";
import { SupabaseSession as Session, supabase } from "@amurex/supabase";
import { Button } from "@amurex/ui/components";

export const Navbar = () => {
  console.log("navbar!");
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);

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
  const isActive = (path: string): boolean => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <aside
      className="hidden lg:flex w-16 shadow-md flex-col justify-between items-center py-4 h-full z-50 border-r border-zinc-800"
      style={{ backgroundColor: "black" }}
    >
      <span
        className="text-4xl cursor-pointer"
        role="img"
        aria-label="Amurex logo"
        onClick={() => router.push("/search")}
      >
        <img
          src="/amurex.png"
          alt="Amurex logo"
          className="w-10 h-10 border-2 border-black rounded-full hover:border-[#6D28D9] transition-colors"
          style={{ color: "var(--color-4)" }}
        />
      </span>
      <div className="flex flex-col items-center space-y-8 mb-4">
        <div className="relative group">
          <Button
            //   TODO?: following variant is incorrect as there is not "active-navbar" or "navbar" variant
            // variant={isActive("/search") ? "active-navbar" : "navbar"}
            variant={"ghost"}
            size="icon"
            onClick={() => router.push("/search")}
            className={
              isActive("/search") ? "bg-[#3c1671] border border-[#6D28D9]" : ""
            }
          >
            <Search
              className="h-6 w-6"
              style={{
                color: "oklch(55.2% 0.016 285.938)",
                strokeWidth: "2.5",
              }}
            />
          </Button>
          <span className="absolute left-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
            Search
          </span>
        </div>
        <div className="relative group">
          <Button
            //   TODO?: following variant is incorrect as there is not "active-navbar" or "navbar" variant
            // variant={isActive("/search") ? "active-navbar" : "navbar"}
            variant={"ghost"}
            size="icon"
            onClick={() => router.push("/meetings")}
            className={
              isActive("/meetings")
                ? "bg-[#3c1671] border border-[#6D28D9]"
                : ""
            }
          >
            <Video
              className="h-6 w-6"
              style={{ color: "oklch(55.2% 0.016 285.938)" }}
            />
          </Button>
          <span className="absolute left-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
            Meetings
          </span>
        </div>
        <div className="relative group">
          <Button
            //   TODO?: following variant is incorrect as there is not "active-navbar" or "navbar" variant
            // variant={isActive("/search") ? "active-navbar" : "navbar"}
            variant={"ghost"}
            size="icon"
            onClick={() => router.push("/emails")}
            className={
              isActive("/emails") ? "bg-[#3c1671] border border-[#6D28D9]" : ""
            }
          >
            <Mail
              className="h-6 w-6"
              style={{ color: "oklch(55.2% 0.016 285.938)" }}
            />
          </Button>
          <span className="absolute left-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
            Emails
          </span>
        </div>
        <div className="relative group">
          <Button
            //   TODO?: following variant is incorrect as there is not "active-navbar" or "navbar" variant
            // variant={isActive("/search") ? "active-navbar" : "navbar"}
            variant={"ghost"}
            size="icon"
            onClick={() => router.push("/settings?tab=personalization")}
            className={
              isActive("/settings")
                ? "bg-[#3c1671] border border-[#6D28D9]"
                : ""
            }
          >
            <Settings
              className="h-6 w-6"
              style={{ color: "oklch(55.2% 0.016 285.938)" }}
            />
          </Button>
          <span className="absolute left-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
            Settings
          </span>
        </div>
      </div>
    </aside>
  );
};
