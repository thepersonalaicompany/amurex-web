"use client";

import {
  ChatSidebarAndPopup,
  MainMeetContent,
  MeetErrorFallback,
  MeetLoader,
  MeetModalComponent,
  MeetPreviewModalComponent,
  MobileChatPopup,
} from "@amurex/ui/components";
import { useTranscriptDetailStore } from "@amurex/ui/store";
import { useRef } from "react";

export const MeetDetail = ({
  styles,
  params,
}: {
  styles: {
    readonly [key: string]: string;
  };
  params: { id: string };
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { loading, error, transcript } = useTranscriptDetailStore();

  if (loading) {
    return <MeetLoader />;
  }

  if (error || !transcript) {
    return <MeetErrorFallback />;
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="p-6 mx-auto">
        <MeetModalComponent id={params.id} />

        <MeetPreviewModalComponent params={params} />

        <ChatSidebarAndPopup messagesEndRef={messagesEndRef} />

        <MobileChatPopup messagesEndRef={messagesEndRef} />

        <MainMeetContent params={params} styles={styles} />
      </div>
    </div>
  );
};
