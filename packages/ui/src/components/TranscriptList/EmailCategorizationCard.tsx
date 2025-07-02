import { Card, CardContent } from "@amurex/ui/components";
import { Video } from "lucide-react";

export const EmailCategorizationCard = () => {
  return (
    <div className="mt-8 mx-auto max-w-4xl">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#9334E9] to-[#9334E9] rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-x"></div>
        <Card className="bg-black border-zinc-500 relative overflow-hidden w-full">
          <div className="absolute inset-0 bg-[#9334E9]/20 animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#9334E9]/30 via-[#9334E9]/20 to-[#9334E9]/30"></div>
          <CardContent className="p-4 relative text-center">
            <div className="flex items-center gap-4 justify-center">
              <Video className="w-6 h-6 text-[#9334E9] hidden" />
              <div>
                <h3 className="font-medium text-white text-lg">
                  Try Amurex for Online Meetings
                </h3>
                <p className="text-sm text-zinc-400">
                  Get AI-powered summaries for your meetings
                </p>
              </div>
            </div>
            <div className="mt-4">
              <a
                href="https://chromewebstore.google.com/detail/amurex-early-preview/dckidmhhpnfhachdpobgfbjnhfnmddmc"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] hover:bg-[#3c1671] hover:border-[#6D28D9] transition-colors duration-200"
              >
                Get Chrome Extension
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
