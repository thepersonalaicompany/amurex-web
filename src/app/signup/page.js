"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const router = useRouter();

  let signinRedirect = "/signin";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("welcome") === "true" &&
      params.get("extension") === "true"
    ) {
      signinRedirect += "?welcome=true&extension=true";
    } else if (params.get("welcome") === "true") {
      signinRedirect += "?welcome=true";
    } else if (params.get("extension") === "true") {
      signinRedirect += "?extension=true";
    }
  }, []);

  const createUserEntry = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .insert([{ id: userId, email: email }]);

    if (error) {
      console.error("Error creating user entry:", error);
      setMessage(
        "Account created, but there was an error setting up your profile. Please contact support."
      );
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    console.log("This is the data", data);

    if (error) {
      setMessage(error.message);
    } else if (data.user) {
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

      await createUserEntry(data.user.id);
      setMessage("Account created successfully!");

      // Send email to external endpoint
      try {
        const response = await fetch("https://api.amurex.ai/send_user_email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            type: "signup",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send email to external endpoint");
        }

        console.log("Email sent successfully to external endpoint");
      } catch (err) {
        console.error("Error sending email to external endpoint:", err);
      }

      router.push("/welcome");
    } else {
      setMessage("An unexpected error occurred. Please try again.");
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
              Sign Up
            </h1>
            <p className="text-sm text-gray-400 md:text-base">
              Enter your details to create your account
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form onSubmit={handleSignUp} className="space-y-4 md:space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium font-semibold text-white">
                  First Name
                </label>
                <Input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-[#262727] bg-[#262727] px-3 py-3 text-sm text-white md:py-4 md:text-base"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium font-semibold text-white">
                  Last Name
                </label>
                <Input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-[#262727] bg-[#262727] px-3 py-3 text-sm text-white md:py-4 md:text-base"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium font-semibold text-white">
                Email
              </label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#262727] bg-[#262727] px-3 py-3 text-sm text-white md:py-4 md:text-base"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium font-semibold text-white">
                Password
              </label>
              <Input
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#262727] bg-[#262727] px-3 py-3 text-sm text-white md:py-4 md:text-base"
              />
              <p className="mt-1 py-2 text-xs text-gray-400 md:py-4 md:text-sm">
                Must be at least 8 characters
              </p>
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
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400 md:mt-6 md:text-sm">
            Already have an account?{" "}
            <Link
              href={signinRedirect}
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
