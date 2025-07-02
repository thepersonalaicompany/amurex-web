import { useSearchStore } from "@amurex/ui/store";

export const Sources = ({ content = [], filters = {} }) => {
  // Filter sources based on filter settings
  const { filteredSources } = useSearchStore();

  // Helper function to determine source icon based on 'type' directly
  const getSourceIcon = (type: string) => {
    switch (type) {
      case "gmail":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="w-4 flex-shrink-0"
          />
        );

      case "msteams":
        return (
          <img
            src="https://www.svgrepo.com/show/303180/microsoft-teams-logo.svg"
            alt="Microsoft Teams"
            className="w-4"
          />
        );

      case "google_meet":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Google_Meet_icon_%282020%29.svg/1024px-Google_Meet_icon_%282020%29.svg.png?20221213135236"
            alt="Google Meet"
            className="w-4"
          />
        );

      case "google_docs":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
            alt="Google Docs"
            className="w-3"
          />
        );

      case "notion":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
            alt="Notion"
            className="w-4"
          />
        );

      case "obsidian":
        return (
          <img
            src="https://obsidian.md/images/obsidian-logo-gradient.svg"
            alt="Obsidian"
            className="w-4"
          />
        );

      case "email":
        return (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="w-4 flex-shrink-0"
          />
        );

      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 text-zinc-400"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
    }
  };

  if (!content || content?.length === 0) {
    return (
      <div>
        <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
          {/* <GitBranch size={20} className="md:w-6 md:h-6" /> */}
          {/* <span>Sources</span> */}
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((_, index) => (
            <div
              key={index}
              className="bg-black rounded-lg p-4 border border-zinc-800"
            >
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show message when all sources are filtered out
  /* if (filteredSources.length === 0 && content.length > 0) {
    return (
      <div>
        <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
          <GitBranch size={20} className="md:w-6 md:h-6" />
          <span>Sources</span>
        </div>
        <div className="bg-black rounded-lg p-4 border border-zinc-800 text-zinc-400 text-center">
          <p>All sources are filtered out. Enable source types to see results.</p>
        </div>
      </div>
    );
  } */

  return (
    <div>
      {/*  */}
      <div className="text-[#9334E9] font-medium mb-3 text-md md:text-xl flex items-center gap-2">
        {/* <GitBranch size={20} className="md:w-6 md:h-6" /> */}
        {/* <span>Sources</span> */}
      </div>
      <div className="sourceItems no-scrollbar">
        {Array.isArray(filteredSources) &&
          filteredSources.map((source, index) => {
            return (
              <a
                key={index}
                href={source.url || "#"}
                className="block sourceItem"
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* bg-black rounded-lg p-4 border border-zinc-800 hover:border-[#6D28D9] transition-colors h-[160px] relative */}
                <div className="">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute top-4 right-4 w-4 h-4 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  <div className="text-zinc-300 text-sm font-medium mb-2 flex items-center gap-2">
                    {getSourceIcon(source.type)}
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-normal max-w-full text-zinc-400 text-xs">
                        {source.type === "gmail" || source.type === "email"
                          ? "Gmail"
                          : source.type === "google_docs"
                            ? "Docs"
                            : source.type === "notion"
                              ? "Notion"
                              : source.type === "obsidian"
                                ? "Obsidian"
                                : source.type === "msteams" ||
                                    source.type === "google_meet"
                                  ? "Meeting"
                                  : "Note"}
                      </span>

                      {/* Show sender if available (for email types) */}
                      {source.from && (
                        <span className="text-xs text-zinc-400 truncate max-w-full">
                          {source.from}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-zinc-300 font-medium text-xs overflow-hidden line-clamp-2">
                    <p>{source.title || "Document"}</p>
                  </div>
                </div>
              </a>
            );
          })}
      </div>
    </div>
  );
};
Sources.displayName = "Sources";
