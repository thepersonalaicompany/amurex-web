"use client";

import { useTranscriptDetailStore } from "@amurex/ui/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const MeetDetailClient = async ({
  children,
  messagesEndRef,
  params,
}: {
  children: React.ReactNode;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  params: { id: string };
}) => {
  const router = useRouter();
  const { fetchSession, setIsMobile, fetchMemoryStatus, fetchTranscript } =
    useTranscriptDetailStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchSession(router);
  }, [router]);

  useEffect(() => {
    scrollToBottom();
  });

  useEffect(() => {
    // Check if the device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    fetchMemoryStatus(router);
    fetchTranscript(params, router);
  }, [params.id]);
  return <>{children}</>;
};
