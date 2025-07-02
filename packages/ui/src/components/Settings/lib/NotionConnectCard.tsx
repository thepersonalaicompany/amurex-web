"use client";

import {
  Button,
  Card,
  CardContent,
  PROVIDER_ICONS,
} from "@amurex/ui/components";
import { useSettingsStore } from "@amurex/ui/store";

export const NotionConnectCard = () => {
  const { notionConnected, connectNotion, isImporting, importSource } =
    useSettingsStore();

  return (
    <Card className="bg-black border-zinc-800 flex-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={PROVIDER_ICONS.notion} alt="Notion" className="w-6 h-6" />
            <div>
              <h3 className="font-medium text-white text-lg">Connect Notion</h3>
              <p className="text-sm text-zinc-400">Sync your Notion pages</p>
            </div>
          </div>
          <Button
            variant="outline"
            className={`bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 ${
              notionConnected ? "bg-green-900 hover:bg-green-800" : ""
            } min-w-[100px]`}
            onClick={connectNotion}
            disabled={isImporting && importSource === "Notion"}
          >
            {isImporting && importSource === "Notion" ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9334E9] mr-2"></div>
                Importing...
              </div>
            ) : notionConnected ? (
              "Connected"
            ) : (
              "Connect"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
