"use client";

import { useSettingsStore } from "@amurex/ui/store";

export const SettingsSidebar = () => {
  const { handleTabChange, activeTab } = useSettingsStore();

  return (
    <div className="w-64 flex-shrink-0 bg-black p-4 border-r border-zinc-800 overflow-y-auto">
      <h2 className="text-2xl font-medium text-white mb-6">Settings</h2>
      <div className="text-md space-y-2">
        <button
          onClick={() => handleTabChange("personalization")}
          className={`w-full text-left px-4 py-2 rounded-lg ${
            activeTab === "personalization"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          Personalization
        </button>
        <button
          onClick={() => handleTabChange("account")}
          className={`w-full text-left px-4 py-2 rounded-lg ${
            activeTab === "account"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          Account
        </button>
        <button
          onClick={() => handleTabChange("team")}
          className={`w-full text-left px-4 py-2 rounded-lg hidden ${
            activeTab === "team"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          Team
        </button>
        <button
          onClick={() => handleTabChange("feedback")}
          className={`w-full text-left px-4 py-2 rounded-lg ${
            activeTab === "feedback"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          Feedback
        </button>
      </div>
    </div>
  );
};
