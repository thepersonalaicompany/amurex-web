"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMessage("Please enter your new password below");
      }
    });
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated successfully!");
      setTimeout(() => {
        router.push("/web_app/signin");
      }, 2000);
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
              Set New Password
            </h1>
            <p className="text-sm text-gray-400 md:text-base">
              Enter your new password below
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form
            onSubmit={handlePasswordReset}
            className="space-y-4 md:space-y-6"
          >
            <div>
              <label className="mb-1 block text-sm font-medium font-semibold text-white">
                New Password
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-[#262727] bg-[#262727] px-3 py-3 text-sm text-white md:py-4 md:text-base"
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
              className="w-full rounded-lg border border-[#0E0F0F] bg-white p-2.5 text-sm font-semibold text-[#0E0F0F] transition-all duration-200 hover:border-white hover:bg-[#0E0F0F] hover:text-white md:p-3 md:text-base"
            >
              {loading ? "Processing..." : "Update Password"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400 md:mt-6 md:text-sm">
            Remember your password?{" "}
            <Link
              href="/web_app/signin"
              className="font-light text-white hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
