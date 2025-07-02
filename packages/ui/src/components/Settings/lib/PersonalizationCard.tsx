"use client";
import {
  Button,
  Card,
  CardContent,
  PROVIDER_ICONS,
  Switch,
} from "@amurex/ui/components";
import { MemoryToggle } from "./MemoryToggle";
import { GmailConnectCard } from "./GmailConnectCard";
import { NotionConnectCard } from "./NotionConnectCard";
import { ObsidianConnectCard } from "./ObsidianConnectCard";
import { OmiConnectCard } from "./OmiConnectCard";
import { useSettingsStore } from "@amurex/ui/store";
import { Plus } from "lucide-react";

export const PersonalizationCard = () => {
  const {
    activeTab,
    emailLabelingEnabled,
    handleEmailLabelToggle,
    gmailPermissionError,
    isProcessingEmails,
    processGmailLabels,
    processedEmailCount,
  } = useSettingsStore();

  return (
    <>
      {activeTab === "personalization" && (
        <div className="space-y-8">
          <h1 className="text-2xl font-medium text-white">Personalization</h1>

          {/* Memory Toggle */}
          <Card className="bg-black border-zinc-800">
            <CardContent className="p-6 space-y-6">
              <MemoryToggle />

              <div className="flex gap-4">
                <GmailConnectCard />

                <NotionConnectCard />
              </div>

              <div className="flex gap-4">
                <ObsidianConnectCard />

                <OmiConnectCard />
              </div>

              <div className="flex gap-4">
                <Card className="bg-black border-zinc-800 flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white text-lg">
                            Request Integration
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Suggest the next integration
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 min-w-[100px]"
                        onClick={() =>
                          window.open(
                            "https://github.com/thepersonalaicompany/amurex-web/issues/new",
                            "_blank",
                          )
                        }
                      >
                        Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-4 mt-4 hidden">
                <Card className="bg-black border-zinc-800 flex-1">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img
                          src={PROVIDER_ICONS.gmail}
                          alt="Gmail"
                          className="w-6"
                        />
                        <div>
                          <h3 className="font-medium text-white text-lg">
                            Gmail Smart Labels
                          </h3>
                          <p className="text-sm text-zinc-400">
                            Auto-categorize emails with AI
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={emailLabelingEnabled}
                          onCheckedChange={handleEmailLabelToggle}
                          className={emailLabelingEnabled ? "bg-[#9334E9]" : ""}
                        />
                        {gmailPermissionError && (
                          <Button
                            variant="outline"
                            className="bg-amber-900 text-amber-100 hover:bg-amber-800 border-amber-700 min-w-[100px]"
                            // onClick={handleReconnectGoogle}          TODO?: this function is never implemented in the original codebase
                          >
                            Reconnect Google
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Status messages */}
                    {processedEmailCount > 0 && (
                      <p className="text-sm text-green-500 mt-2">
                        Successfully processed {processedEmailCount} emails
                      </p>
                    )}
                    {gmailPermissionError && (
                      <p className="text-sm text-amber-500 mt-2">
                        Additional Gmail permissions are required. Please
                        reconnect your Google account.
                      </p>
                    )}
                    {emailLabelingEnabled && !gmailPermissionError && (
                      <p className="text-xs text-zinc-400 mt-2">
                        Uses AI to categorize your unread emails (max 10) and
                        apply labels in Gmail
                      </p>
                    )}

                    {/* Prominent Process Emails button */}
                    {emailLabelingEnabled && !gmailPermissionError && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:border-[#9334E9] border border-zinc-700 min-w-[140px] px-4 py-2"
                          onClick={processGmailLabels}
                          disabled={isProcessingEmails}
                        >
                          {isProcessingEmails ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9334E9] mr-2"></div>
                              Processing...
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <img
                                src={PROVIDER_ICONS.gmail}
                                alt="Gmail"
                                className="w-4 mr-2"
                              />
                              Process Emails
                            </div>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
