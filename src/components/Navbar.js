"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Home, Compass, Bell, MessageCircle, Settings, Plus } from "lucide-react";
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
    <aside className="w-16 shadow-md flex flex-col justify-between items-center py-4 fixed h-full z-50" style={{ backgroundColor: "var(--surface-color-2)" }}>
      <span className="text-4xl" role="img" aria-label="Dog emoji">
        🐶
      </span>
      <div className="flex flex-col items-center space-y-8 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <Home className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
        {/* <Button variant="ghost" size="icon">
          <Compass className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button> */}
        <Button variant="ghost" size="icon" onClick={() => router.push('/chat')}>
          <MessageCircle className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => router.push('/upload')}>
          <Plus className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
          <Settings className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
      </div>
    </aside>
  );
}
