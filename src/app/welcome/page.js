"use client";

export default function Welcome() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 md:p-0"
      style={{
        backgroundImage: "url(/sign-background.webp)",
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
              className="w-full bg-white text-[#0E0F0F] p-2.5 md:p-3 text-sm md:text-base font-semibold rounded-lg hover:bg-[#0E0F0F] hover:text-white hover:border-white border border-[#0E0F0F] transition-all duration-200 text-center flex items-center justify-center gap-2"
              href="https://meet.new"
              target="_blank"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 87.5 72">
                <path fill="#0066da" d="M0 51.5V66c0 3.315 2.685 6 6 6h14.5l3-10.96-3-9.54-9.95-3z"/>
                <path fill="#e94235" d="M20.5 0L0 20.5l10.55 3 9.95-3 2.95-9.41z"/>
                <path fill="#2684fc" d="M20.5 20.5H0v31h20.5z"/>
                <path fill="#00ac47" d="M82.6 8.68L69.5 19.42v33.66l13.16 10.79c1.97 1.54 4.85.135 4.85-2.37V11c0-2.535-2.945-3.925-4.91-2.32zM49.5 36v15.5h-29V72h43c3.315 0 6-2.685 6-6V53.08z"/>
                <path fill="#ffba00" d="M63.5 0h-43v20.5h29V36l20-16.57V6c0-3.315-2.685-6-6-6z"/>
              </svg>
              Start a Google Meet
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}
