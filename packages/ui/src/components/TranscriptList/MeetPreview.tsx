export const MeetPreview = () => {
  return (
    <div className="relative mt-8 mx-auto max-w-4xl rounded-xl overflow-hidden border border-zinc-800">
      {/* Main meeting area - using gmeet.png as background */}
      <div
        className="bg-[#0f0f10] h-[450px] relative"
        style={{
          backgroundImage: "url('/gmeet_new.png')",
          backgroundSize: "cover",
          backgroundPosition: "right center",
        }}
      >
        {/* Dimming overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>

        <div className="flex items-center justify-start pl-4 pt-4 relative z-10">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Google_Meet_icon_%282020%29.svg/1024px-Google_Meet_icon_%282020%29.svg.png?20221213135236"
            alt="Google Meet"
            className="w-8"
          />
          <span className="pl-2 text-white text-base">Google Meet</span>
        </div>
        {/* Meeting controls - positioned at bottom center */}
        <div className="absolute bottom-8 left-1/3 transform -translate-x-1/2 flex items-center gap-6 z-10">
          <div className="w-14 h-14 rounded-full bg-[#ea4335] flex items-center justify-center">
            <span className="text-white text-2xl">×</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#3c4043] flex items-center justify-center">
            <span className="text-white text-xl">🎤</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#3c4043] flex items-center justify-center">
            <span className="text-white text-xl">📹</span>
          </div>
        </div>
      </div>

      {/* Amurex sidepanel */}
      <div className="absolute top-0 right-0 h-full w-[380px] bg-[#0a0a0a] border-l border-zinc-800">
        {/* Amurex header */}
        <div className="flex items-center justify-between py-2 px-4 border-b border-zinc-800">
          <div className="flex items-center">
            <span className="text-white text-xl font-medium">Amurex</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-lg">⚙️</span>
            <span className="text-zinc-400 text-lg">➡️</span>
          </div>
        </div>

        {/* Sidepanel content - smaller text */}
        <div className="p-4">
          <div className="mb-6">
            <h3 className="text-white text-lg font-medium mb-2">
              Action items
            </h3>
            <div className="text-zinc-300 text-sm">
              <p className="mb-2 font-bold">You</p>
              <ul className="list-disc pl-5 mb-2">
                <li>Start using Amurex for your meetings</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-white text-lg font-medium mb-2">Summary</h3>
            <div className="text-zinc-300 text-sm">
              <p className="mb-2">
                <span className="font-medium">Date:</span> September 14, 2024
              </p>
              <p className="mb-1">
                <span className="font-medium">Participants:</span>
              </p>
              <ul className="list-disc pl-5 mb-2">
                <li>You</li>
              </ul>
              <p className="mb-1">
                <span className="font-medium">Summary:</span>
              </p>
              <ul className="list-disc pl-5 mb-2">
                <li>Onboarding process to get started with Amurex.</li>
              </ul>
              <p className="mb-1">
                <span className="font-medium">Key Points:</span>
              </p>
              <ul className="list-disc pl-5">
                <li>Amurex will help you organize your work and life.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom tabs */}
        <div className="absolute bottom-0 w-full flex border-t border-zinc-800">
          <div className="flex-1 py-4 text-center text-purple-500 border-t-2 border-purple-500 font-medium text-base">
            Summary
          </div>
          <div className="flex-1 py-4 text-center text-zinc-400 font-medium text-base">
            Live Suggestions
          </div>
        </div>
      </div>
    </div>
  );
};
