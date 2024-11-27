"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  let signinRedirect = "/signin";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "true") {
      signinRedirect += "?welcome=true";
    }
    if (params.get("extension") === "true") {
      signinRedirect += "?extension=true";
    }
  }, []);

  const createUserEntry = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .insert([{ id: userId, email: email }]);

    if (error) {
      console.error('Error creating user entry:', error);
      setMessage('Account created, but there was an error setting up your profile. Please contact support.');
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else if (data.user) {
      await createUserEntry(data.user.id);
      setMessage('Account created successfully! Check your email for the confirmation link.');
      router.push('/signin');
    } else {
      setMessage('An unexpected error occurred. Please try again.');
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
            <h1 className="font-serif text-3xl md:text-4xl mb-2 text-white" style={{ fontFamily: "var(--font-noto-serif)" }}>
              Sign Up
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Enter your details to create your account
            </p>
          </div>
          
          <hr className="mb-6 border-gray-800" />

          <form onSubmit={handleSignUp} className="space-y-4 md:space-y-6">
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
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 md:py-4 px-3 bg-[#262727] text-white border border-[#262727] text-sm md:text-base"
              />
              <p className="mt-1 text-xs md:text-sm text-gray-400 py-2 md:py-4">
                Must be at least 8 characters
              </p>
            </div>

            {message && (
              <p className={`text-xs md:text-sm ${message.includes('error') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-[#0E0F0F] p-2.5 md:p-3 text-sm md:text-base font-semibold rounded-lg hover:bg-[#0E0F0F] hover:text-white hover:border-white border border-[#0E0F0F] transition-all duration-200"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-400">
            Already have an account?{" "}
            <Link href={signinRedirect} className="text-white font-light hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
