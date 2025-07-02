import { ChatCenteredDots } from "@phosphor-icons/react";

export const Heading = ({ content = "" }) => {
  return (
    <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
      <ChatCenteredDots size={20} className="md:w-6 md:h-6" />
      <span>{content}</span>
    </div>
  );
};
Heading.displayName = "Heading";
