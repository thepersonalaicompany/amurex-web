"use client";

import { Button, Card, CardContent, IconToggle } from "@amurex/ui/components";
import { useSettingsStore } from "@amurex/ui/store";
import { Clock, LogOut } from "lucide-react";

export const AccountsCard = () => {
  const {
    activeTab,
    userEmail,
    createdAt,
    emailNotificationsEnabled,
    handleEmailNotificationsToggle,
    initiateLogOut,
  } = useSettingsStore();
  return (
    <>
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
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-md font-medium bg-gradient-to-r from-[#9334E9]/60 to-[#9334E9]/40 text-[#e0c5f9] border border-[#9334E9]/50 shadow-[0_0_12px_rgba(147,52,233,0.45)] animate-pulse-slow relative overflow-hidden group">
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#9334E9]/40 to-transparent animate-shimmer"></span>
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#9334E9]/20 via-[#9334E9]/50 to-[#9334E9]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-full blur-sm"></div>
                        <Clock className="w-3 h-3 mr-1" />
                        With us since
                      </div>
                      <p className="text-white mt-1">{createdAt}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800">
                    <div className="flex items-center justify-between hidden">
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
                        className="text-sm bg-zinc-800 hover:bg-red-500 text-white whitespace-nowrap flex items-center mt-auto w-fit group"
                        onClick={initiateLogOut}
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
    </>
  );
};
