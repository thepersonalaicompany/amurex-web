"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  // Check if we're in a Chrome extension environment
  const isExtension = useEffect(() => {
    return window.chrome && chrome.runtime && chrome.runtime.id;
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
      // Store the session data in localStorage
      const sessionData = {
        user: data.user,
        session: data.session,
        timestamp: new Date().getTime()
      };
      const session = sessionData.session;
      localStorage.setItem('brainex_session', JSON.stringify(session));

      // If we're in a Chrome extension environment, send message back
      if (isExtension) {
        try {
          window.postMessage(
            { 
              type: 'BRAINEX_SIGNIN_SUCCESS', 
              payload: session
            }, 
            '*'
          );
        } catch (err) {
          console.error('Error sending message to extension:', err);
        }
      }

      router.push("/");
      setMessage("Signing in...");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Sign In to Brainex</h1>
      <form onSubmit={handleSignIn} className="w-full max-w-sm">
        <Input
          className="mb-4"
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          className="mb-4"
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button className="w-full mb-4" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      {message && <p className="mt-4 text-red-500">{message}</p>}
      <p className="mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-blue-500 hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
