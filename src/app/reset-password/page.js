"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    console.log("This is the origin", window.location.origin);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    console.log("This is the error", error);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the password reset link!");
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
              Reset Password
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Enter your email to receive reset instructions
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form onSubmit={handleSendResetEmail} className="space-y-4 md:space-y-6">
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
              {loading ? "Sending..." : "Send Reset Instructions"}
            </button>
          </form>

          <p className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-400">
            Remember your password?{" "}
            <Link href="/signin" className="text-white font-light hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
