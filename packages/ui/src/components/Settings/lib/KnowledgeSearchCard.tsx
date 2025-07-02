"use client";

import { Button, Card, CardContent } from "@amurex/ui/components";
import { useSettingsStore } from "@amurex/ui/store";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

export const KnowledgeSearchCard = () => {
  const { logUserAction, userId } = useSettingsStore();
  const router = useRouter();

  return (
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
                    Knowledge Search (new!)
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Try our new feature - search your emails, documents, notes,
                    and more
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9334E9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
                <Button
                  variant="outline"
                  className="relative bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:border-[#9334E9] border border-zinc-800 rounded-md backdrop-blur-sm transition-colors duration-200"
                  onClick={async () => {
                    // Track button click with analytics
                    try {
                      // Log the user action for analytics using stored userId
                      await logUserAction(
                        userId || "not-required", // Use userId if available, fallback to "not-required"
                        "web_memory_chat_tried",
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
  );
};
