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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const router = useRouter();
  const [redirectUrl, setRedirectUrl] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Add useEffect to get redirect URL from query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect) {
      setRedirectUrl(decodeURIComponent(redirect));
    }
  }, []);

  // Handle OAuth session after redirect
  useEffect(() => {
    const handleOAuthSession = async () => {
      // Check for OAuth return by looking for specific URL params or hash fragments
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Check if this looks like an OAuth callback
      const hasOAuthParams =
        urlParams.has("code") ||
        hashParams.has("access_token") ||
        hashParams.has("type");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      // Only process if we have a session AND it looks like an OAuth return
      if (session && session.user && hasOAuthParams) {
        console.log("Detected OAuth return with session:", session.user.email);

        // User successfully signed in with OAuth
        const sessionData = {
          user: session.user,
          session: session,
          timestamp: new Date().getTime(),
        };

        Cookies.set("amurex_session", JSON.stringify(session), {
          expires: 7,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
        });

        try {
          // Create user entry in database with Google tokens
          const googleTokens = {
            access_token: session.provider_token,
            refresh_token: session.provider_refresh_token,
          };
          await createUserEntry(
            session.user.id,
            session.user.email,
            googleTokens
          );

          // Create user_gmails entry for Google OAuth users
          const { data: gmailData, error: gmailError } = await supabase
            .from("user_gmails")
            .insert({
              user_id: session.user.id,
              email_address: session.user.email,
              access_token: session.provider_token,
              refresh_token: session.provider_refresh_token,
              type: "gmail_only",
              google_cohort: 10,
            });

          if (gmailError) {
            console.error("Error creating user_gmails entry:", gmailError);
          } else {
            console.log("Successfully created user_gmails entry");
          }

          // Send email notification
          const email = session.user.email;
          console.log("Sending email to", email);

          const response = await fetch(
            "https://api.amurex.ai/send_user_email",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: email,
                type: "signup",
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to send email to external endpoint");
          }

          console.log("Email sent successfully to external endpoint");
        } catch (err) {
          console.error("Error in OAuth post-processing:", err);
        }

        // Clean up URL and redirect to destination
        const destination = "/hello";
        console.log("OAuth successful, redirecting to:", destination);
        window.history.replaceState({}, document.title, "/web_app/signup"); // Clean up URL
        setTimeout(() => {
          window.location.href = destination;
        }, 100);
      }
    };

    handleOAuthSession();
  }, []);

  let signinRedirect = `/web_app/signin${
    redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""
  }`;

  const createUserEntry = async (
    userId,
    userEmail = email,
    googleTokens = null
  ) => {
    const userRecord = {
      id: userId,
      email: userEmail,
    };

    // Add Google OAuth fields if tokens are provided
    if (googleTokens) {
      userRecord.google_access_token = googleTokens.access_token;
      userRecord.google_refresh_token = googleTokens.refresh_token;
      userRecord.google_token_expiry = null;
      userRecord.google_token_version = "gmail_only";
      userRecord.google_cohort = 10;
    }

    const { data, error } = await supabase.from("users").insert([userRecord]);

    if (error) {
      // If error code is 23505, it means the record already exists (unique constraint violation)
      if (error.code === "23505") {
        // User already exists, no need to do anything
        return;
      }
      console.error("Error creating user entry:", error);
      setMessage(
        "Account created, but there was an error setting up your profile. Please contact support."
      );
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/web_app/signup${
            redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""
          }`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error("Error with Google sign-in:", err);
      setMessage("An error occurred with Google sign-in. Please try again.");
      setGoogleLoading(false);
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

      try {
        await createUserEntry(data.user.id, data.user.email);
        setMessage("Account created successfully!");
      } catch (err) {
        console.error("Error creating user entry:", err);
        setMessage(
          "Account created, but there was an error setting up your profile. Please contact support."
        );
      }

      console.log("Sending email to", email);
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

      // Log the redirect destination for debugging
      // const destination = redirectUrl || "/hello";
      const destination = "/hello";
      console.log("Attempting to redirect to:", destination);

      // Try a more direct approach to redirection
      window.location.href = destination;
    } else {
      setMessage("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center p-4 md:p-0"
      style={{
        backgroundImage: "url(/sign-background.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Amurex Logo - Top Right */}
      <div className="absolute left-4 top-4 z-10 flex items-center md:left-6 md:top-6">
        <img
          src="/amurex.png"
          alt="Amurex logo"
          className="h-8 w-8 rounded-full border-2 border-white md:h-10 md:w-10"
        />
        <p className="pl-2 text-base font-semibold text-white md:text-lg">
          Amurex
        </p>
      </div>

      <div className="w-full max-w-[95%] max-w-lg">
        <div className="w-full rounded-lg p-6 md:p-8">
          <div className="mb-6 text-center md:mb-8">
            <h1
              className="mb-2 text-3xl text-white md:text-4xl"
              style={{ fontFamily: "var(--font-noto-serif)" }}
            >
              Start using Amurex
            </h1>
          </div>

          {!showEmailForm && (
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg !bg-white p-2.5 text-sm font-normal text-[#0E0F0F] transition-all duration-200 hover:!bg-gray-300 md:p-3 md:text-base"
              style={{ fontFamily: "var(--font-noto-serif)" }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoading
                ? "Signing in with Google..."
                : "Sign up with Google"}
            </button>
          )}

          {!showEmailForm ? (
            <>
              <div className="relative mb-6">
                <hr className="border-gray-800" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform bg-[#0E0F0F] px-3 text-sm text-gray-400">
                  or
                </span>
              </div>
              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full rounded-lg border border-gray-800 p-2.5 text-sm font-normal text-gray-400 transition-all duration-200 hover:bg-gray-800 hover:text-white md:p-3 md:text-base"
                style={{ fontFamily: "var(--font-noto-serif)" }}
              >
                Sign up with email
              </button>
              <p className="mt-4 text-center text-xs text-gray-400">
                By signing up, you agree to our{" "}
                <Link
                  href="https://amurex.ai/tos"
                  target="_blank"
                  className="font-bold hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="https://amurex.ai/privacy-policy"
                  target="_blank"
                  className="font-bold hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowEmailForm(false)}
                className="mb-4 w-full p-2 text-sm font-medium text-gray-400 transition-all duration-200 hover:text-white md:text-base"
              >
                ← Back to Google Sign Up
              </button>

              <form
                onSubmit={handleSignUp}
                className="mx-auto max-w-md space-y-4"
              >
                <div className="flex gap-4">
                  <div className="flex-1 bg-transparent">
                    <Input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-zinc-400 bg-transparent px-3 py-3 text-sm font-light text-white md:py-4"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-zinc-400 bg-transparent px-3 py-3 text-sm font-light text-white md:py-4"
                    />
                  </div>
                </div>

                <div>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-zinc-400 bg-transparent px-3 py-3 text-sm font-light text-white md:py-4"
                  />
                </div>

                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-zinc-400 bg-transparent px-3 py-3 text-sm font-light text-white md:py-4"
                  />
                  <p className="mt-1 py-2 text-xs text-gray-400 md:py-4 md:text-sm">
                    Password must be at least 8 characters
                  </p>
                </div>

                {message && (
                  <p
                    className={`text-xs md:text-sm ${
                      message.includes("error")
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
                  className="text-md w-full rounded-lg border border-zinc-400 bg-[#9334E9] p-2.5 font-light text-[#FAFAFA] transition-all duration-200 hover:border-[#6D28D9] hover:bg-[#3c1671] md:p-3"
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-sm font-light text-white">
            Already have an account?{" "}
            <Link
              href={signinRedirect}
              className="font-bold text-white hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Testimonial Block */}
        <div className="mx-auto mt-8 w-full max-w-md">
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-16 w-16 overflow-hidden rounded-full bg-gray-300">
                <img
                  src="/testimonial-avatar.jpg"
                  alt="Testimonial avatar"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
                <img
                  src="https://images.crunchbase.com/image/upload/c_thumb,h_170,w_170,f_auto,g_face,z_0.7,b_white,q_auto:eco,dpr_2/v1397186118/aa46748ccea376ecbf6c30173a34d1e0.jpg"
                  alt="Sudha Valluru"
                  className="h-full w-full object-cover"
                />
              </div>
              <blockquote className="mb-4 text-lg font-medium leading-relaxed text-white">
                &quot;I wish I could have Amurex as my gmail search bar... It
                has the potential to elevate how we engage with digital
                information.&quot;
              </blockquote>
              <div className="text-white">
                <div className="font-semibold">Sudha Valluru</div>
                <div className="text-sm text-gray-300">
                  COO & Co-founder @ NaceAI (backed by General Catalyst)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
