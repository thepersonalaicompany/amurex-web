export const EmailsHeader = () => {
  return (
    <div className="p-8 pb-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-medium text-white">Emails</h2>
      </div>
      <p className="text-sm text-zinc-400 mb-6">
        Automated email categorization to keep your inbox focused on important
        messages
      </p>

      {/* Fake search bar */}
      <a href="/search" rel="noopener noreferrer">
        <div className="hidden my-2 bg-zinc-800/80 rounded-xl flex items-center px-3 py-2 cursor-text hover:bg-zinc-700 transition-colors border border-white/10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-400 mr-2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <div className="text-zinc-400 text-md">Search in emails...</div>
        </div>
      </a>
    </div>
  );
};
