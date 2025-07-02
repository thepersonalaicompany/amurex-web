import { IconToggle } from "@amurex/ui/components";
import { useSettingsStore } from "@amurex/ui/store";
import { Cloud } from "lucide-react";

export const MemoryToggle = () => {
  const { memoryEnabled, handleMemoryToggle } = useSettingsStore();
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
          <Cloud className="w-5 h-5 text-[#9334E9]" />
          Memory
        </h2>
        <p className="text-sm text-zinc-400">
          Enable memory storing to unlock our{" "}
          <b>AI-powered knowledge search feature</b>, allowing you to have
          intelligent conversations about your past meetings, emails, documents,
          and more
        </p>
      </div>
      <div className="flex items-center gap-2">
        <IconToggle checked={memoryEnabled} onChange={handleMemoryToggle} />
      </div>
    </div>
  );
};
