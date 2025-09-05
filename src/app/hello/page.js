import Link from "next/link";

export default function HelloPage() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto max-w-none px-4 py-8">
          {/* Header with title and skip button */}
          <div className="mb-6 flex items-center justify-between">
            <div className="w-full text-center">
              <p className="mt-2 text-lg text-white">
                Amurex is an AI Personal Assistant that shapes itself around you
                and the tools you use. It structures a memory layer about what
                you do and how you do it.
              </p>
              <h1 className="mt-6 text-2xl text-white">
                Here&apos;s what Amurex can do:
              </h1>
            </div>

            <Link
              href="/search"
              className="inline-flex hidden cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#9334E9] px-4 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671]"
            >
              Skip Onboarding
            </Link>
          </div>

          {/* Three Feature Columns */}
          <div className="grid grid-cols-1 gap-4 px-2 md:grid-cols-3">
            {/* Search Column */}
            <div
              className="translate-y-8 animate-fadeInUp rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 opacity-0"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="mb-4">
                <img
                  src="/search.gif"
                  alt="Search feature"
                  className="w-full rounded-lg bg-zinc-800 object-cover"
                />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                1. Searches your Gmail, Notion, and more
              </h3>
              <p className="mb-4 text-zinc-400">
                Quickly find any information across your emails, documents, and
                meetings with our powerful AI-powered search.
              </p>
              <Link
                href="/search"
                className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#9334E9] px-4 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671]"
              >
                Try Search →
              </Link>
            </div>

            {/* Email Organizer Column */}
            <div
              className="translate-y-8 animate-fadeInUp rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 opacity-0"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="mb-4">
                <img
                  src="/labels.png"
                  alt="Email organizer feature"
                  className="w-full rounded-lg bg-zinc-800 object-cover"
                />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                2. Organizes your emails
              </h3>
              <p className="mb-4 text-zinc-400">
                Automatically organize and categorize your emails with AI. Never
                lose an important message again.
              </p>
              <Link
                href="/emails"
                className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#9334E9] px-4 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671]"
              >
                Organize Emails →
              </Link>
            </div>

            {/* Meetings Column */}
            <div
              className="translate-y-8 animate-fadeInUp rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 opacity-0"
              style={{ animationDelay: "0.6s" }}
            >
              <div className="mb-4">
                <img
                  src="https://www.amurex.ai/images/amurex-meetings.gif"
                  alt="Meetings feature"
                  className="w-full rounded-lg bg-zinc-800 object-cover"
                />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">
                3. Takes notes from meetings
              </h3>
              <p className="mb-4 text-zinc-400">
                Schedule, manage, and get AI-generated summaries of your
                meetings all in one place.
              </p>
              <Link
                href="/meetings"
                className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-white/10 bg-[#9334E9] px-4 py-2 text-sm font-medium text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671]"
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
