import Link from 'next/link';

export default function HelloPage() {
  return (
    <div className="flex min-h-screen bg-black text-white">

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto px-4 py-8 max-w-none">
          {/* Header with title and skip button */}
          <div className="flex justify-between items-center mb-6">
            <div className="text-center w-full">
              <p className="text-white mt-2 text-lg">Amurex is an AI Personal Assistant that shapes itself around you and the tools you use. It structures a memory layer about what you do and how you do it.</p>
              <h1 className="mt-6 text-2xl text-white">Here's what Amurex can do:</h1>
            </div>
            
            <Link 
              href="/search" 
              className="hidden px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
            >
              Skip Onboarding
            </Link>
          </div>
          
          {/* Three Feature Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
            
            {/* Search Column */}
            <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 opacity-0 translate-y-8 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="mb-4">
                <img 
                  src="/search.gif" 
                  alt="Search feature"
                  className="w-full object-cover rounded-lg bg-zinc-800"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">1. Searches your Gmail, Notion, and more</h3>
              <p className="text-zinc-400 mb-4">
                Quickly find any information across your emails, documents, and meetings with our powerful AI-powered search.
              </p>
              <Link 
                href="/search"
                className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
              >
                Try Search →
              </Link>
            </div>

            {/* Email Organizer Column */}
            <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 opacity-0 translate-y-8 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <div className="mb-4">
                <img 
                  src="/labels.png" 
                  alt="Email organizer feature"
                  className="w-full object-cover rounded-lg bg-zinc-800"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">2. Organizes your emails</h3>
              <p className="text-zinc-400 mb-4">
                Automatically organize and categorize your emails with AI. Never lose an important message again.
              </p>
              <Link 
                href="/emails"
                className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
              >
                Organize Emails →
              </Link>
            </div>

            {/* Meetings Column */}
            <div className="bg-zinc-900/50 rounded-lg p-6 border border-zinc-800 opacity-0 translate-y-8 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
              <div className="mb-4">
                <img 
                  src="https://www.amurex.ai/images/amurex-meetings.gif" 
                  alt="Meetings feature"
                  className="w-full object-cover rounded-lg bg-zinc-800"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">3. Takes notes from meetings</h3>
              <p className="text-zinc-400 mb-4">
                Schedule, manage, and get AI-generated summaries of your meetings all in one place.
              </p>
              <Link 
                href="/meetings"
                className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
              >
                View Meetings →
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
