"use client";

export const dynamic = "force-dynamic";

import { SettingsContent } from "@amurex/web/components/SettingsContent";
import { Suspense } from "react";

const SettingPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
};
export default SettingPage;
