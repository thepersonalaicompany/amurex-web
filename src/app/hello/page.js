import Link from 'next/link';
import { Navbar } from "@/components/Navbar";

export default function HelloPage() {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Left App Navbar - the thin one */}
      <div className="w-16 flex-shrink-0 bg-black border-r border-zinc-800">
        <Navbar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto p-8">
          {/* Header with title and skip button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-medium text-white">Welcome to Amurex!</h1>
              <p className="text-zinc-400 mt-2">This is a quick tour that will help you get started with Amurex</p>
            </div>
            
            <Link 
              href="/search" 
              className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#3c1671] hover:border-[#6D28D9]"
            >
              Skip Onboarding
            </Link>
          </div>
          
          <div 
            style={{ position: "relative", paddingBottom: "56.25%", height: 0, width: "100%" }}
            className="mb-6"
          >
            <iframe 
              style={{ 
                position: "absolute", 
                top: 0, 
                left: 0, 
                width: "100%", 
                height: "100%", 
                border: 0 
              }}
              src="https://share.layerpath.com/e/cm926gsck000ol70cwlgptoh2/tour" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
