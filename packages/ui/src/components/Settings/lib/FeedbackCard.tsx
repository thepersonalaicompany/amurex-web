"use client";

import { Button, Card, CardContent } from "@amurex/ui/components";
import { useSettingsStore } from "@amurex/ui/store";
import { Calendar, Github } from "lucide-react";

export const FeedbackCard = () => {
  const { activeTab } = useSettingsStore();
  return (
    <>
      {activeTab === "feedback" && (
        <div className="space-y-10">
          <h1 className="text-2xl font-medium text-white">Feedback</h1>

          <Card className="bg-black border-zinc-800">
            <CardContent className="p-6">
              {/* Report an issue */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-md font-semibold flex items-center gap-2 text-white">
                      Encounter an issue?
                    </h2>
                    <p className="text-sm text-zinc-400">
                      Help us improve by reporting issues
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-zinc-800 hover:bg-zinc-700 text-white whitespace-nowrap flex items-center"
                    onClick={() =>
                      window.open(
                        "https://github.com/thepersonalaicompany/amurex-web/issues/new",
                        "_blank",
                      )
                    }
                  >
                    <Github className="w-5 h-5 text-[#9334E9] mr-2" />
                    Report Issue
                  </Button>
                </div>

                {/* Book a call */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-md font-semibold flex items-center gap-2 text-white">
                      Want to give us feedback?
                    </h2>
                    <p className="text-sm text-zinc-400">
                      Book a call with us to talk about your experience
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-zinc-800 hover:bg-zinc-700 text-white whitespace-nowrap flex items-center"
                    onClick={() =>
                      window.open(
                        "https://cal.com/founders-the-personal-ai-company/15min",
                        "_blank",
                      )
                    }
                  >
                    <Calendar className="w-5 h-5 text-[#9334E9] mr-2" />
                    Book a call
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
