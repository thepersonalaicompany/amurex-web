"use client";

import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingFallback from "@/components/LoadingFallback";

const JoinTeamContent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [teamName, setTeamName] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const fetchTeamDetails = async () => {
      const teamId = searchParams.get("team_id");
      if (!teamId) {
        setMessage("Invalid team invitation link");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("teams")
          .select("team_name")
          .eq("id", teamId)
          .single();

        if (error) throw error;
        setTeamName(data.team_name);
      } catch (error) {
        console.error("Error fetching team details:", error);
        setMessage("Invalid team invitation link");
      }
    };

    fetchTeamDetails();
  }, [searchParams]);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
    };

    checkSession();
  }, []);

  const handleJoinTeam = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (session) {
        // If user is already signed in, just add them to the team
        await addUserToTeam(session.user.id);
        setMessage("Successfully joined the team!");
        const teamId = searchParams.get("team_id");
        router.push(`/teams/${teamId}`);
      } else {
        // First check if user exists
        const { data: existingUser } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (existingUser?.user) {
          // Existing user - add to team
          await addUserToTeam(existingUser.user.id);
        } else {
          // New user - create account and add to team
          const { data, error } = await supabase
            .from("users")
            .insert([{ id: userId, email: email }]);

          const { data: newUser, error: signUpError } =
            await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  first_name: firstName,
                  last_name: lastName,
                },
              },
            });

          if (signUpError) throw signUpError;

          if (newUser?.user) {
            await addUserToTeam(newUser.user.id);

            // Create user entry in users table
            const { error: userError } = await supabase
              .from("users")
              .insert([{ id: newUser.user.id, email: email }]);

            if (userError) throw userError;
          }
        }

        setMessage("Successfully joined the team!");
        const teamId = searchParams.get("team_id");
        router.push(`/teams/${teamId}`);
      }
    } catch (error) {
      console.error("Error joining team:", error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addUserToTeam = async (userId) => {
    const teamId = searchParams.get("team_id");
    const { error } = await supabase.from("team_members").insert([
      {
        team_id: teamId,
        user_id: userId,
        role: "member",
        name: `${firstName} ${lastName}`,
        status: "accepted",
      },
    ]);

    if (error) throw error;
  };

  // Simplified UI for signed-in users
  if (session) {
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
                Join {teamName}
              </h1>
              <p className="text-sm text-gray-400 md:text-base">
                as {session.user.email}
              </p>
            </div>

            {message && (
              <p
                className={`text-xs md:text-sm ${
                  message.includes("error") || message.includes("Invalid")
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {message}
              </p>
            )}

            <button
              onClick={handleJoinTeam}
              disabled={loading}
              className="w-full rounded-lg border border-[#0E0F0F] bg-white p-2.5 text-sm font-semibold text-[#0E0F0F] transition-all duration-200 hover:border-white hover:bg-[#0E0F0F] hover:text-white md:p-3 md:text-base"
            >
              {loading ? "Joining Team..." : "Join Team"}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              Join {teamName}
            </h1>
            <p className="text-sm text-gray-400 md:text-base">
              Create an account or sign in to join the team
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form onSubmit={handleJoinTeam} className="space-y-4 md:space-y-6">
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
                  message.includes("error") || message.includes("Invalid")
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
              className="w-full rounded-lg border border-[#0E0F0F] bg-white p-2.5 text-sm font-semibold text-[#0E0F0F] transition-all duration-200 hover:border-white hover:bg-[#0E0F0F] hover:text-white md:p-3 md:text-base"
            >
              {loading ? "Joining Team..." : "Join Team"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400 md:mt-6 md:text-sm">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-light text-white hover:underline"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default function JoinTeam() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JoinTeamContent />
    </Suspense>
  );
}
