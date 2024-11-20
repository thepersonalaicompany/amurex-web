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
          </div>
          <h2 className="text-4xl font-semibold mb-4 text-white">
            Welcome to Amurex
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
            Create Account
          </h1>
          <p className="text-gray-600 mb-8">
            Enter your details to create your account
          </p>

          <form onSubmit={handleSignUp} className="space-y-6">
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
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-50"
              />
            </div>

            {message && (
              <p className={`text-sm ${message.includes('error') ? 'text-red-500' : 'text-green-500'}`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white p-3 rounded-lg hover:bg-white hover:text-black border border-black transition-all duration-200"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="text-black font-semibold hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
