"use client";

import { Suspense, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Navbar } from "@/components/Navbar";
import { Plus } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function EmailsContent() {
  const [userId, setUserId] = useState(null);
  const [categories, setCategories] = useState({
    categories: {
      to_respond: true,
      fyi: true,
      comment: true,
      notification: true,
      meeting_update: true,
      awaiting_reply: true,
      actioned: true
    },
    custom_properties: {}
  });

  useEffect(() => {
    const fetchUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        fetchCategories(session.user.id);
      }
    };

    fetchUserId();
  }, []);

  const fetchCategories = async (uid) => {
    try {
      const response = await fetch(`/api/email-preferences?userId=${uid}`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching email categories:", error);
      toast.error("Failed to load email preferences");
    }
  };

  const handleCategoryToggle = async (category, checked) => {
    try {
      const newCategories = {
        ...categories,
        categories: {
          ...categories.categories,
          [category]: checked
        }
      };

      const response = await fetch('/api/email-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          categories: newCategories
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCategories(newCategories);
        toast.success(`${category.replace('_', ' ')} category updated`);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  return (
    <div className="flex min-h-screen bg-black">
      <Navbar />

      {/* Main Content Area */}
      <div className="flex-1 ml-16 p-8">
        <div>
          <h1 className="text-4xl font-semibold text-white mb-2">Emails</h1>
          <p className="text-gray-400 mb-6">
            Automatically sort and filter your emails to keep your main inbox
            focused on important messages.
          </p>

          {/* Info Card */}
          <div className="bg-[#13141A] rounded-lg p-4 mb-6 flex items-start gap-3">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-gray-400 mt-1"
            >
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 16V12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-gray-400">
              If you switch a category off here, emails in that category will be
              filed away in their folder or label, and won&apos;t be shown in
              your main inbox.
            </span>
          </div>

          {/* Categories Section */}
          <div className="bg-[#13141A] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h2 className="text-white">Show in inbox?</h2>
              <h2 className="text-white">Categories</h2>
            </div>

            {/* Category Items */}
            <div className="divide-y divide-zinc-800">
              {/* To respond */}
              <div className="px-6 py-4 flex items-center justify-between">
                <Switch
                  checked={categories.categories.to_respond}
                  onCheckedChange={(checked) => handleCategoryToggle('to_respond', checked)}
                  className="data-[state=checked]:bg-[#F87171] data-[state=unchecked]:bg-zinc-700"
                />
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#F87171] text-black px-3 py-1 rounded text-sm font-medium">
                    To respond
                  </span>
                  <span className="text-gray-400">
                    Emails you need to respond to
                  </span>
                </div>
              </div>

              {/* FYI */}
              <div className="px-6 py-4 flex items-center justify-between">
                <Switch
                  checked={categories.categories.fyi}
                  onCheckedChange={(checked) => handleCategoryToggle('fyi', checked)}
                  className="data-[state=checked]:bg-[#F59E0B] data-[state=unchecked]:bg-zinc-700"
                />
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#F59E0B] text-black px-3 py-1 rounded text-sm font-medium">
                    FYI
                  </span>
                  <span className="text-gray-400">
                    Emails that don&apos;t require your response, but are
                    important
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div className="px-6 py-4 flex items-center justify-between">
                <Switch
                  checked={categories.categories.comment}
                  onCheckedChange={(checked) => handleCategoryToggle('comment', checked)}
                  className="data-[state=checked]:bg-[#F59E0B] data-[state=unchecked]:bg-zinc-700"
                />
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#F59E0B] text-black px-3 py-1 rounded text-sm font-medium">
                    Comment
                  </span>
                  <span className="text-gray-400">
                    Team chats in tools like Google Docs or Microsoft Office
                  </span>
                </div>
              </div>

              {/* Notification */}
              <div className="px-6 py-4 flex items-center justify-between">
                <Switch
                  checked={categories.categories.notification}
                  onCheckedChange={(checked) => handleCategoryToggle('notification', checked)}
                  className="data-[state=checked]:bg-[#34D399] data-[state=unchecked]:bg-zinc-700"
                />
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#34D399] text-black px-3 py-1 rounded text-sm font-medium">
                    Notification
                  </span>
                  <span className="text-gray-400">
                    Automated updates from tools you use
                  </span>
                </div>
              </div>

              {/* Meeting update */}
              <div className="px-6 py-4 flex items-center justify-between">
                <Switch
                  checked={categories.categories.meeting_update}
                  onCheckedChange={(checked) => handleCategoryToggle('meeting_update', checked)}
                  className="data-[state=checked]:bg-[#60A5FA] data-[state=unchecked]:bg-zinc-700"
                />
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#60A5FA] text-black px-3 py-1 rounded text-sm font-medium">
                    Meeting update
                  </span>
                  <span className="text-gray-400">
                    Calendar updates from Zoom, Google Meet, etc
                  </span>
                </div>
              </div>

              {/* Awaiting reply */}
              <div className="px-6 py-4 flex items-center justify-between">
                <Switch
                  checked={categories.categories.awaiting_reply}
                  onCheckedChange={(checked) => handleCategoryToggle('awaiting_reply', checked)}
                  className="data-[state=checked]:bg-[#8B5CF6] data-[state=unchecked]:bg-zinc-700"
                />
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded text-sm font-medium">
                    Awaiting reply
                  </span>
                  <span className="text-gray-400">
                    Emails you&apos;ve sent that you&apos;re expecting a reply
                    to
                  </span>
                </div>
              </div>

              {/* Actioned */}
              <div className="px-6 py-4 flex items-center justify-between">
                <Switch
                  checked={categories.categories.actioned}
                  onCheckedChange={(checked) => handleCategoryToggle('actioned', checked)}
                  className="data-[state=checked]:bg-[#8B5CF6] data-[state=unchecked]:bg-zinc-700"
                />
                <div className="flex-1 flex items-center gap-3 ml-6">
                  <span className="bg-[#8B5CF6] text-white px-3 py-1 rounded text-sm font-medium">
                    Actioned
                  </span>
                  <span className="text-gray-400">
                    Emails you&apos;ve sent that you&apos;re not expecting a
                    reply to
                  </span>
                </div>
              </div>

              {/* Add custom category button */}
              <div className="px-6 py-4 flex justify-center">
                <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <Plus className="w-5 h-5" />
                  Add custom category
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailsContent />
    </Suspense>
  );
}

