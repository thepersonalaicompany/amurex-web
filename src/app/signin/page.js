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
    }
    else if (params.get("welcome") === "true") {
      signupRedirect += "?welcome=true";
    }
    else if (isExtensionAuth) {
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
        if (isWelcome) {
          router.push("/welcome");
        } else {
          router.push("/settings");
        }
        setMessage("Signing in...");
      }
    }

    setLoading(false);
  };

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
              Welcome
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Sign in to get access to Amurex.
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form onSubmit={handleSignIn} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium font-semibold text-white mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 md:py-4 px-3 bg-[#262727] text-white border border-[#262727] text-sm md:text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium font-semibold text-white mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 md:py-4 px-3 bg-[#262727] text-white border border-[#262727] text-sm md:text-base"
              />
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
              {/* <button type="button" className="text-sm text-gray-400 hover:text-white">
                Forgot Password
              </button> */}
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
              className="w-full bg-white text-[#0E0F0F] p-2.5 md:p-3 text-sm md:text-base font-semibold rounded-lg hover:bg-[#0E0F0F] hover:text-white hover:border-white border border-[#0E0F0F] transition-all duration-200"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link
              href={signupRedirect}
              className="text-white font-light hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
