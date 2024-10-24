"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/Button";
import { Home, Compass, Bell, MessageCircle, Settings, Plus } from "lucide-react";

export function Navbar() {
  const router = useRouter();

  return (
    <aside className="w-16 shadow-md flex flex-col justify-between items-center py-4 fixed h-full z-50" style={{ backgroundColor: "var(--surface-color-2)" }}>
      <span className="text-4xl" role="img" aria-label="Dog emoji">
        🐶
      </span>
      <div className="flex flex-col items-center space-y-8 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
          <Home className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
        <Button variant="ghost" size="icon">
          <Compass className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
        <Button variant="ghost" size="icon">
          <MessageCircle className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
          <Settings className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => router.push('/upload')}>
          <Plus className="h-6 w-6" style={{ color: "var(--color-4)" }} />
        </Button>
      </div>
    </aside>
  );
}

