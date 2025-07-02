"use client";

import {
  Button,
  Card,
  CardContent,
  PROVIDER_ICONS,
} from "@amurex/ui/components";
import { useSettingsStore } from "@amurex/ui/store";
import { useRouter } from "next/navigation";

export const GmailConnectCard = () => {
  const { googleDocsConnected } = useSettingsStore();
  const router = useRouter();
  return (
    <Card className="bg-black border-zinc-800 flex-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={PROVIDER_ICONS.gmail} alt="Google" className="w-6" />
            <div>
              <h3 className="font-medium text-white text-lg">Connect Gmail</h3>
              <p className="text-sm text-zinc-400">Sync your Gmail inbox</p>
            </div>
          </div>
          <Button
            variant="outline"
            className={`bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 ${
              googleDocsConnected ? "bg-green-900 hover:bg-green-800" : ""
            } min-w-[100px]`}
            onClick={() => {
              router.push("/emails");
            }}
          >
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
