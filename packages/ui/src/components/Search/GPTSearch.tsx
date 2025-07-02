import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type GPTSearchProps = {
  content?: string;
  className?: string;
};

export const GPTSearch: React.FC<GPTSearchProps> = ({
  content = "",
  className,
}) => {
  const [showEmailButton, setShowEmailButton] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setShowEmailButton(false);
    setIsComplete(false);

    if (
      content.toLowerCase().includes("subject:") ||
      content.toLowerCase().includes("dear ")
    ) {
      setShowEmailButton(true);
    }

    if (contentRef.current) {
      contentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [content]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!content.endsWith("▋")) {
        setIsComplete(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content]);

  const openGmail = async () => {
    // Placeholder for session and logUserAction
    // You should implement fetchSession and logUserAction with proper types
    // const session = await fetchSession();
    // await logUserAction(session.user.id, "web_open_email_in_gmail");

    const cleanContent = content
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/\n\n+/g, "\n\n")
      .replace(/\n/g, "%0A")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/%0A\s+/g, "%0A")
      .replace(/%0A%0A+/g, "%0A%0A");

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&body=${cleanContent}`;
    window.open(gmailUrl, "_blank");
  };

  return (
    <div ref={contentRef} className={className}>
      <div className="prose text-md leading-8 font mt-1 w-full break-words prose-p:mb-4 text-white">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: (() => {
              let linkCounter = 0;
              const LinkComponent: React.FC<
                React.AnchorHTMLAttributes<HTMLAnchorElement>
              > = (props) => {
                linkCounter += 1;
                return (
                  <a
                    {...props}
                    className="text-[#9334E9] font-normal hover:text-[#7928CA] transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    (Link {linkCounter})
                  </a>
                );
              };
              LinkComponent.displayName = "MarkdownLink";
              return LinkComponent;
            })(),
            p: (() => {
              const ParagraphComponent: React.FC<
                React.HTMLAttributes<HTMLParagraphElement>
              > = (props) => <p className="mb-4" {...props} />;
              ParagraphComponent.displayName = "MarkdownParagraph";
              return ParagraphComponent;
            })(),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      {showEmailButton && isComplete && (
        <button
          onClick={openGmail}
          className="mt-4 px-4 py-2 rounded-lg bg-[#9334E9] text-white hover:bg-[#7928CA] transition-colors flex items-center gap-2"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="h-4"
          />
          Open in Gmail
        </button>
      )}
    </div>
  );
};
GPTSearch.displayName = "GPTSearch";
