"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from 'js-cookie';

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const extensionId = searchParams.get('extensionId');
  const isExtensionFlow = searchParams.get('extension') === 'true' || !!extensionId;

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
      // Store the session data in a cookie
      const sessionData = {
        user: data.user,
        session: data.session,
        timestamp: new Date().getTime()
      };
      const session = sessionData.session;
      
      // Set cookie with secure options
      Cookies.set('brainex_session', JSON.stringify(session), {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // If we're in a Chrome extension environment, send message back
      if (isExtension) {
        try {
          window.postMessage(
            { 
              type: 'BRAINEX_SIGNIN_SUCCESS', 
              payload: session,
              extensionId: extensionId
            }, 
            '*'
          );
          setMessage("Extension connected successfully! You can close this window.");
        } catch (err) {
          console.error('Error sending message to extension:', err);
        }
      } else {
        router.push("/");
        setMessage("Signing in...");
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Sign In to Brainex</h1>
      {isExtensionFlow && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg">
          Signing in through the Brainex Extension
        </div>
      )}
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
      {message && (
        <p className={`mt-4 ${message.includes('Extension connected') ? 'text-green-500' : 'text-red-500'}`}>
          {message}
        </p>
      )}
      <p className="mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-blue-500 hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
