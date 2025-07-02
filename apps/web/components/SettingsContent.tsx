import {
  InviteModal,
  MainSettingsComponent,
  MobileWarningBanner,
  ObsidianModal,
  ShowSignedOut,
} from "@amurex/ui/components";

export const SettingsContent = () => {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <MobileWarningBanner />
      <MainSettingsComponent />
      <ShowSignedOut />
      <InviteModal />
      <ObsidianModal />
    </div>
  );
};
