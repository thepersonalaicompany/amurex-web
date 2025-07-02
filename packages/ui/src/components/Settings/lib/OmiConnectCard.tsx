"use client";

import {
  Button,
  Card,
  CardContent,
  PROVIDER_ICONS,
} from "@amurex/ui/components";
import { useSettingsStore } from "@amurex/ui/store";

export const OmiConnectCard = () => {
  const { omiConnected, connectOmi, isImporting, importSource } =
    useSettingsStore();

  return (
    <Card className="bg-black border-zinc-800 flex-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={PROVIDER_ICONS.omi} alt="Omi" className="w-8 " />
            <div>
              <h3 className="font-medium text-white text-lg">Connect Omi</h3>
              <p className="text-sm text-zinc-400">
                A two way connection to and from your Omi memories.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className={`bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 ${
              omiConnected ? "bg-green-900 hover:bg-green-800" : ""
            } min-w-[100px]`}
            onClick={connectOmi}
            // disabled={isImporting && importSource === "Omi"}
          >
            {isImporting && importSource === "Omi" ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9334E9] mr-2"></div>
                Importing...
              </div>
            ) : omiConnected ? (
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
