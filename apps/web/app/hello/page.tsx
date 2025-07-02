import { FeatureCard } from "@amurex/web/components/FutureCard";
import Link from "next/link";

const HelloPage = () => {
  const features = [
    {
      imageSrc: "/search.gif",
      imageAlt: "Search feature",
      title: "1. Searches your Gmail, Notion, and more",
      description:
        "Quickly find any information across your emails, documents, and meetings with our powerful AI-powered search.",
      linkHref: "/search",
      linkText: "Try Search",
      animationDelay: "0.2s",
    },
    {
      imageSrc: "/labels.png",
      imageAlt: "Email organizer feature",
      title: "2. Organizes your emails",
      description:
        "Automatically organize and categorize your emails with AI. Never lose an important message again.",
      linkHref: "/emails",
      linkText: "Organize Emails",
      animationDelay: "0.4s",
    },
    {
      imageSrc: "https://www.amurex.ai/images/amurex-meetings.gif",
      imageAlt: "Meetings feature",
      title: "3. Takes notes from meetings",
      description:
        "Schedule, manage, and get AI-generated summaries of your meetings all in one place.",
      linkHref: "/meetings",
      linkText: "View Meetings",
      animationDelay: "0.6s",
    },
  ];

  return (
    <div className="flex min-h-screen bg-black text-white">
      <div className="flex-1 overflow-hidden">
        <div className="mx-auto px-4 py-8 max-w-none">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center w-full">
              <p className="text-white mt-2 text-lg">
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
              className="hidden px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
            >
              Skip Onboarding
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelloPage;
