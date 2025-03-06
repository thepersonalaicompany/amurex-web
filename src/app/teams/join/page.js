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
      const teamId = searchParams.get('team_id');
      if (!teamId) {
        setMessage('Invalid team invitation link');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('teams')
          .select('team_name')
          .eq('id', teamId)
          .single();

        if (error) throw error;
        setTeamName(data.team_name);
      } catch (error) {
        console.error('Error fetching team details:', error);
        setMessage('Invalid team invitation link');
      }
    };

    fetchTeamDetails();
  }, [searchParams]);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
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
        const teamId = searchParams.get('team_id');
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
          
          const { data: newUser, error: signUpError } = await supabase.auth.signUp({
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
        const teamId = searchParams.get('team_id');
        router.push(`/teams/${teamId}`);
      }
    } catch (error) {
      console.error('Error joining team:', error);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addUserToTeam = async (userId) => {
    const teamId = searchParams.get('team_id');
    const { error } = await supabase
      .from('team_members')
      .insert([
        { 
          team_id: teamId,
          user_id: userId,
          role: 'member',
          name: `${firstName} ${lastName}`,
          status: 'accepted'
        }
      ]);

    if (error) throw error;
  };

  // Simplified UI for signed-in users
  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 md:p-0"
        style={{
          backgroundImage: "url(/sign-background.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}>
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
                Join {teamName}
              </h1>
              <p className="text-gray-400 text-sm md:text-base">
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
              className="w-full bg-white text-[#0E0F0F] p-2.5 md:p-3 text-sm md:text-base font-semibold rounded-lg hover:bg-[#0E0F0F] hover:text-white hover:border-white border border-[#0E0F0F] transition-all duration-200"
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
              Join {teamName}
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Create an account or sign in to join the team
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form onSubmit={handleJoinTeam} className="space-y-4 md:space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium font-semibold text-white mb-1">
                  First Name
                </label>
                <Input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full py-3 md:py-4 px-3 bg-[#262727] text-white border border-[#262727] text-sm md:text-base"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium font-semibold text-white mb-1">
                  Last Name
                </label>
                <Input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full py-3 md:py-4 px-3 bg-[#262727] text-white border border-[#262727] text-sm md:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium font-semibold text-white mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
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
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 md:py-4 px-3 bg-[#262727] text-white border border-[#262727] text-sm md:text-base"
              />
              <p className="mt-1 text-xs md:text-sm text-gray-400 py-2 md:py-4">
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
              className="w-full bg-white text-[#0E0F0F] p-2.5 md:p-3 text-sm md:text-base font-semibold rounded-lg hover:bg-[#0E0F0F] hover:text-white hover:border-white border border-[#0E0F0F] transition-all duration-200"
            >
              {loading ? "Joining Team..." : "Join Team"}
            </button>
          </form>

          <p className="mt-4 md:mt-6 text-center text-xs md:text-sm text-gray-400">
            Already have an account?{" "}
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

export default function JoinTeam() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JoinTeamContent />
    </Suspense>
  );
}