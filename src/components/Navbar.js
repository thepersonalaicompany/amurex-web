"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Home, Compass, Bell, MessageCircle, Settings, Plus, Brain } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';

export function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) return null;

  return (
    <aside className="hidden lg:flex w-16 shadow-md flex-col justify-between items-center py-4 fixed h-full z-50 border-r border-zinc-800" style={{ backgroundColor: "black" }}>
      <span className="text-4xl" role="img" aria-label="Amurex logo">
      <img 
        src="/amurex.png" 
        alt="Amurex logo"
        className="w-10 h-10 border-2 border-black rounded-full" 
        style={{ color: "var(--color-4)" }}
      />
      </span>
      <div className="flex flex-col items-center space-y-8 mb-4">
        <div className="relative group">
          <Button variant="navbar" size="icon" onClick={() => router.push('/meetings')}>
            <Home className="h-6 w-6" style={{ color: "var(--color-4)" }} />
          </Button>
          <span className="absolute left-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
            Meetings
          </span>
        </div>
        {/* Repeat the above structure for other buttons */}
        <div className="relative group">
          <Button variant="navbar" size="icon" onClick={() => router.push('/settings?tab=personalization')}>
            <Settings className="h-6 w-6" style={{ color: "var(--color-4)" }} />
          </Button>
          <span className="absolute left-12 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
            Settings
          </span>
        </div>
      </div>
    </aside>
  );
}
