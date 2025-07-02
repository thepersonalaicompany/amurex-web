"use client";

import { useTranscriptListStore } from "@amurex/ui/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const TranscriptListClient = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const router = useRouter();
  const { filter, fetchTranscripts, fetchUserTeams, fetchUserSettings } =
    useTranscriptListStore();

  useEffect(() => {
    fetchTranscripts(router);
    fetchUserTeams();
    fetchUserSettings();
  }, [filter]);

  return <>{children}</>;
};
