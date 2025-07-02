import React from "react";
import ReactMarkdown from "react-markdown";

type TranscriptSummaryProps = {
  summary: string;
};

export const TranscriptSummary: React.FC<TranscriptSummaryProps> = ({
  summary,
}) => {
  return (
    <ReactMarkdown
      components={{
        h3: ({ node, ...props }) => (
          <h3 className="mb-1 text-lg font-bold" {...props} />
        ),
        p: ({ node, ...props }) => <p className="mb-2" {...props} />,
        ul: ({ node, ...props }) => (
          <ul className="list-disc pl-5 mb-2" {...props} />
        ),
        li: ({ node, ...props }) => <li className="mb-1 ml-4" {...props} />,
        strong: ({ node, ...props }) => (
          <strong className="font-bold" {...props} />
        ),
      }}
    >
      {summary}
    </ReactMarkdown>
  );
};
