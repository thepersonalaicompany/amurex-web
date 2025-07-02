import React, { useEffect, useRef, useState } from "react";
import { Stack } from "@phosphor-icons/react";

type FollowUpProps = {
  content?: string;
  sendMessage?: (text: string) => void;
};

export const FollowUp: React.FC<FollowUpProps> = ({
  content = "",
  sendMessage = () => {},
}) => {
  const [followUp, setFollowUp] = useState<string[]>([]);
  const messagesEndReff = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTimeout(() => {
      messagesEndReff.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, [followUp]);

  useEffect(() => {
    if (
      typeof content === "string" &&
      content[0] === "{" &&
      content[content.length - 1] === "}"
    ) {
      try {
        const parsed = JSON.parse(content);
        setFollowUp(Array.isArray(parsed.follow_up) ? parsed.follow_up : []);
      } catch (error) {
        console.log("error parsing json", error);
        setFollowUp([]);
      }
    }
  }, [content]);

  const handleFollowUpClick = (
    text: string,
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    e.preventDefault();
    if (text) sendMessage(text);
  };

  return (
    <>
      {followUp.length > 0 && (
        <div className="text-3xl font-bold my-4 w-full flex">
          <Stack size={32} /> <span className="px-2">Follow-Up</span>
        </div>
      )}
      {followUp.map((text, index) => (
        <a
          href="#"
          key={index}
          className="text-xl w-full p-1"
          onClick={(e) => handleFollowUpClick(text, e)}
        >
          <span>{text || ""}</span>
        </a>
      ))}
      <div ref={messagesEndReff} />
    </>
  );
};
FollowUp.displayName = "FollowUp";
