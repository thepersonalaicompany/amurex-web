"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
// import { Button } from "@/components/ui/Button";
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
  const router = useRouter();

  // Check if we're in a Chrome extension environment
  const isExtension = useEffect(() => {
    return window.chrome && chrome.runtime && chrome.runtime.id;
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsExtensionAuth(params.get("extension") === "true");
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

      // Set cookie with secure options
      Cookies.set("brainex_session", JSON.stringify(session), {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      if (isExtensionAuth) {
        // Close the tab after successful authentication
        window.close();
      } else {
        router.push("/");
        setMessage("Signing in...");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div
        className="hidden md:flex md:w-1/2 bg-cover bg-center flex-col justify-center items-center"
        style={{
          backgroundImage: "url(/signin-background-dark.png)",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-md">
          <div className="flex items-center mb-8">
            {/* <span className="text-xl text-white">Amurex</span> */}
          </div>
          <h2 className="text-4xl font-semibold mb-4 text-white">
            Your AI executive assistant.
          </h2>
          <div className="space-y-4">
            <div className="flex items-center bg-white bg-opacity-20 p-4 rounded-lg">
              <span className="w-3 h-3 rounded-full bg-white text-purple-600 flex items-center justify-center mr-3">
                &nbsp;
              </span>
              <span className="text-white">Capture Moments</span>
            </div>

            <div className="flex items-center bg-white bg-opacity-20 p-4 rounded-lg">
              <span className="w-3 h-3 rounded-full bg-white text-purple-600 flex items-center justify-center mr-3">
                &nbsp;
              </span>
              <span className="text-white">Retreive Insights</span>
            </div>

            <div className="flex items-center bg-white bg-opacity-20 p-4 rounded-lg">
              <span className="w-3 h-3 rounded-full bg-white text-purple-600 flex items-center justify-center mr-3">
                &nbsp;
              </span>
              <span className="text-white">Create Actions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center relative">
        <div className="absolute top-[5vh] left-1/2 transform -translate-x-1/2">
          Amurex
        </div>

        <div className="w-full max-w-md rounded-lg p-8">
          <h1
            className="font-serif text-4xl mb-2"
            style={{ fontFamily: "var(--font-noto-serif)" }}
          >
            Welcome Back
          </h1>
          <p className="text-gray-600 mb-8">
            Sign in to get access to your personal AI assistant.
          </p>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-50"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  id="remember"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-sm text-gray-600"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-black hover:underline"
              >
                Forgot Password
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white p-3 rounded-lg hover:bg-white hover:text-black border border-black transition-all duration-200"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-black font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
