import { Card, CardContent } from "@amurex/ui/components";
import {
  AccountsCard,
  FeedbackCard,
  KnowledgeSearchCard,
  PersonalizationCard,
  SettingsSidebar,
  SettingsWarningModal,
  TeamSettingsCard,
} from "./lib";

export const MainSettingsComponent = () => {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Settings Sidebar */}
      <SettingsSidebar />

      {/* Warning Modal */}
      <SettingsWarningModal />

      {/* Main Content */}
      <div className="flex-1 p-8 bg-black overflow-y-auto">
        <KnowledgeSearchCard />
        <PersonalizationCard />
        <AccountsCard />
        <TeamSettingsCard />
        <FeedbackCard />
      </div>
    </div>
  );
};
