"use client";

import {
  Button,
  Card,
  CardContent,
  PROVIDER_ICONS,
} from "@amurex/ui/components";
import { useSettingsStore } from "@amurex/ui/store";

export const ObsidianConnectCard = () => {
  const { setIsObsidianModalOpen } = useSettingsStore();
  return (
    <Card className="bg-black border-zinc-800 flex-1">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={PROVIDER_ICONS.obsidian}
              alt="Obsidian"
              className="w-6 h-6"
            />
            <div>
              <h3 className="font-medium text-white text-lg">
                Upload from Obsidian
              </h3>
              <p className="text-sm text-zinc-400">
                Import your markdown files
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border-zinc-800 min-w-[100px]"
            onClick={() => setIsObsidianModalOpen(true)}
          >
            Upload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
