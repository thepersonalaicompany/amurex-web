"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { supabase } from "@amurex/supabase";
import { Input } from "@amurex/ui/components";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UpdatePassword(): JSX.Element {
  const [newPassword, setNewPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setMessage("Please enter your new password below");
      }
    });
  }, []);

  const handlePasswordReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password updated successfully!");
      setTimeout(() => {
        router.push("/signin");
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
              Set New Password
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Enter your new password below
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form
            onSubmit={handlePasswordReset}
            className="space-y-4 md:space-y-6"
          >
            <div>
              <label className="block text-sm font-medium font-semibold text-white mb-1">
                New Password
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                }
                className="w-full py-3 md:py-4 px-3 bg-[#262727] text-white border border-[#262727] text-sm md:text-base"
              />
            </div>

            {message && (
              <p
                className={`text-xs md:text-sm ${
                  message.includes("error") ||
                  message.includes("Password should be at least")
                    ? "text-red-500"
                    : "text-green-500"
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
              {loading ? "Processing..." : "Update Password"}
            </button>
          </form>

          <p className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-400">
            Remember your password?{" "}
            <Link
              href="/signin"
              className="text-white font-light hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
