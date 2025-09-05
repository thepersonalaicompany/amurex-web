"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isExtensionAuth, setIsExtensionAuth] = useState(false);
  const [isWelcome, setIsWelcome] = useState(false);
  const router = useRouter();
  let signupRedirect = "/signup";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsExtensionAuth(params.get("extension") === "true");
    setIsWelcome(params.get("welcome") === "true");
    if (params.get("welcome") === "true" && isExtensionAuth) {
      signupRedirect += "?welcome=true&extension=true";
    } else if (params.get("welcome") === "true") {
      signupRedirect += "?welcome=true";
    } else if (isExtensionAuth) {
      signupRedirect += "?extension=true";
    }
  }, []);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      // Store the session data in a cookie
      const sessionData = {
        user: data.user,
        session: data.session,
        timestamp: new Date().getTime(),
      };
      const session = sessionData.session;

      Cookies.set("amurex_session", JSON.stringify(session), {
        expires: 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      if (isExtensionAuth) {
        window.close();
      } else {
        router.push("/welcome");
        setMessage("Signing in...");
      }
    }

    setLoading(false);
  };

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
        <div className="mb-6 flex items-center justify-center md:mb-8">
          <img
            src="/amurex.png"
            alt="Amurex logo"
            className="h-8 w-8 rounded-full border-2 border-white md:h-10 md:w-10"
          />
          <p className="pl-2 text-base font-semibold text-white md:text-lg">
            Amurex
          </p>
        </div>

        <div className="w-full rounded-lg bg-[#0E0F0F] p-6 shadow-lg backdrop-blur-sm md:p-8">
          <div className="mb-6 text-center md:mb-8">
            <h1
              className="mb-2 font-serif text-3xl text-white md:text-4xl"
              style={{ fontFamily: "var(--font-noto-serif)" }}
            >
              Welcome
            </h1>
            <p className="text-sm text-gray-400 md:text-base">
              Sign in to get access to Amurex.
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form onSubmit={handleSignIn} className="space-y-4 md:space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium font-semibold text-white">
                Email
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#262727] bg-[#262727] px-3 py-3 text-sm text-white md:py-4 md:text-base"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium font-semibold text-white">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#262727] bg-[#262727] px-3 py-3 text-sm text-white md:py-4 md:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-700 bg-[#262727]"
                  id="remember"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-gray-400"
                >
                  Remember me
                </label>
              </div>
              <Link
                href="/reset-password"
                className="text-sm text-gray-400 hover:text-white"
              >
                Forgot Password?
              </Link>
            </div>

            {message && (
              <p
                className={`text-xs md:text-sm ${
                  message.includes("error") ? "text-red-500" : "text-green-500"
                }`}
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border border-[#0E0F0F] bg-white p-2.5 text-sm font-semibold text-[#0E0F0F] transition-all duration-200 hover:border-white hover:bg-[#0E0F0F] hover:text-white md:p-3 md:text-base"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400 md:mt-6 md:text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href={signupRedirect}
              className="font-light text-white hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
