import { useSettingsStore } from "@amurex/ui/store";

export const ShowSignedOut = () => {
  const { showSignOutConfirm, setShowSignOutConfirm, handleLogOut } =
    useSettingsStore();
  return (
    <>
      {showSignOutConfirm && (
        <div className="px-2 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-black bg-opacity-40 backdrop-blur-sm p-8 rounded-lg shadow-lg border border-white/20">
            <h3 className="lg:text-xl text-md font-medium mb-4 text-white">
              Confirm Sign Out
            </h3>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-md font-medium border border-white/10 text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                onClick={() => setShowSignOutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-md font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
                onClick={handleLogOut}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
