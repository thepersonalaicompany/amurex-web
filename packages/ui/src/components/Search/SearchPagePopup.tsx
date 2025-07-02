"use client";

import { useSearchStore } from "@amurex/ui/store";
import Popup from "./Popup";

export const SearchPagePopup = () => {
  const {
    isDeletionConfirmationPopupOpened,
    setIsDeletionConfirmationPopupOpened,
    deletionConfirmation,
    deleteThread,
  } = useSearchStore();
  return (
    <Popup
      isPopupOpened={isDeletionConfirmationPopupOpened}
      setIsPopupOpened={setIsDeletionConfirmationPopupOpened}
      forbidClosing={deletionConfirmation?.isWaiting}
    >
      <h3 className="popupTitle">Deleting thread?</h3>
      <p className="popupSubtitle">
        Are you sure you want to delete thread with name &quot;
        {deletionConfirmation?.deletingThread?.title}&quot;?
      </p>

      <p className="errorMessage">{deletionConfirmation?.error}</p>

      <div className="popupConfirmationButtons">
        <button
          className="mr-2 mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-normal border border-white/10 bg-transparent text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]"
          onClick={() => setIsDeletionConfirmationPopupOpened(false)}
          disabled={deletionConfirmation?.isWaiting}
        >
          Cancel
        </button>
        <button
          className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-normal border border-white/10 bg-[#6D28D9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
          onClick={deleteThread}
          disabled={deletionConfirmation?.isWaiting}
        >
          {deletionConfirmation?.isWaiting ? (
            <>
              <span>Deleting...</span>
              <l-tail-chase size="26" speed="1.75" color="white"></l-tail-chase>
            </>
          ) : (
            "Delete"
          )}
        </button>
      </div>
    </Popup>
  );
};
