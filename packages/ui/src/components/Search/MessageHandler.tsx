import React, { memo } from "react";
import { Query } from "./Query";
import { Sources } from "./Sources";
import { VectorCreation } from "./VectorCreation";
import { Heading } from "./Heading";
import { GPTSearch as GPT } from "./GPTSearch";
import { FollowUp } from "./FollowUp";

type MessageType =
  | "Query"
  | "Sources"
  | "VectorCreation"
  | "Heading"
  | "GPT"
  | "FollowUp";

type Message = {
  type: MessageType;
  content: string;
};

type MessageHandlerProps = {
  message?: Message;
  sendMessage?: (text: string) => void;
};

// Wrappers to adapt props for components with different signatures
const SourcesWrapper = ({ content }: { content: string }) => {
  let parsedContent: never[] = [];
  try {
    parsedContent = JSON.parse(content);
    if (!Array.isArray(parsedContent)) parsedContent = [];
  } catch {
    parsedContent = [];
  }
  return <Sources content={parsedContent} />;
};

const GPTWrapper = ({ content }: { content: string }) => (
  <GPT content={content} />
);

const FollowUpWrapper = ({
  content,
  sendMessage,
}: {
  content: string;
  sendMessage?: (text: string) => void;
}) => <FollowUp content={content} sendMessage={sendMessage} />;

const MessageHandler = memo(
  ({
    message = { type: "" as MessageType, content: "" },
    sendMessage = () => {},
  }: MessageHandlerProps) => {
    const COMPONENT_MAP: Record<
      MessageType,
      React.ComponentType<{
        content: string;
        sendMessage?: (text: string) => void;
      }>
    > = {
      Query,
      Sources: SourcesWrapper,
      VectorCreation,
      Heading,
      GPT: GPTWrapper,
      FollowUp: FollowUpWrapper,
    };

    const Component = COMPONENT_MAP[message.type];
    return Component ? (
      <Component content={message.content} sendMessage={sendMessage} />
    ) : null;
  },
);
MessageHandler.displayName = "MessageHandler";

export { MessageHandler };
export type { MessageHandlerProps, Message, MessageType };
