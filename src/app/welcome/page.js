"use client";

export default function Welcome() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 md:p-0"
      style={{
        backgroundImage: "url(/sign-background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-[95%] md:max-w-md">
        <div className="flex justify-center items-center mb-6 md:mb-8">
          <img
            src="/amurex.png"
            alt="Amurex logo"
            className="w-8 h-8 md:w-10 md:h-10 border-2 border-white rounded-full"
          />
          <p className="text-white text-base md:text-lg font-semibold pl-2">
            Amurex
          </p>
        </div>

        <div className="w-full rounded-lg bg-[#0E0F0F] p-6 md:p-8 backdrop-blur-sm shadow-lg">
          <div className="text-center mb-6 md:mb-8">
            <h1
              className="font-serif text-3xl md:text-4xl mb-2 text-white"
              style={{ fontFamily: "var(--font-noto-serif)" }}
            >
              All set!
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Just start a meeting to see Amurex in action.
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form className="space-y-4 md:space-y-6 w-full flex">
            <a
              className="w-full bg-white text-[#0E0F0F] p-2.5 md:p-3 text-sm md:text-base font-semibold rounded-lg hover:bg-[#0E0F0F] hover:text-white hover:border-white border border-[#0E0F0F] transition-all duration-200 text-center"
              href="https://meet.new"
              target="_blank"
            >
              Start a Meeting
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}
