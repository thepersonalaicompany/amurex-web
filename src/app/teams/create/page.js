"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { Users, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateTeam() {
  const [teamName, setTeamName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/web_app/signin");
        return;
      }

      // Create the team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert([
          {
            team_name: teamName,
            location: location,
          },
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      // Add the creator as an owner
      const { error: memberError } = await supabase
        .from("team_members")
        .insert([
          {
            team_id: team.id,
            user_id: session.user.id,
            role: "owner",
            status: "accepted",
          },
        ]);

      if (memberError) throw memberError;

      toast.success("Team created successfully!");
      router.push(`/teams/${team.id}`);
    } catch (error) {
      console.error("Error creating team:", error);
      toast.error("Failed to create team");
    } finally {
      setLoading(false);
    }
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
              Create a Team
            </h1>
            <p className="text-sm text-gray-400 md:text-base">
              Set up a new team for your organization
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form onSubmit={handleCreateTeam} className="space-y-4 md:space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium font-semibold text-white">
                Team Name
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="text"
                  placeholder="Engineering Team"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full border border-[#262727] bg-[#262727] py-3 pl-10 pr-3 text-sm text-white md:py-4 md:text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium font-semibold text-white">
                Location
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
                <Input
                  type="text"
                  placeholder="San Francisco"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-[#262727] bg-[#262727] py-3 pl-10 pr-3 text-sm text-white md:py-4 md:text-base"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !teamName.trim() || !location.trim()}
              className={`w-full rounded-lg p-2.5 text-sm font-semibold transition-all duration-200 md:p-3 md:text-base ${
                loading || !teamName.trim() || !location.trim()
                  ? "cursor-not-allowed bg-gray-600 text-gray-300"
                  : "border border-[#9334E9] bg-[#9334E9] text-white hover:border-[#6D28D9] hover:bg-[#3c1671]"
              }`}
            >
              {loading ? "Creating Team..." : "Create Team"}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-[#262727] p-4">
            <h3 className="mb-2 font-medium text-white">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Your team will be created instantly</li>
              <li>• You&apos;ll be added as the team owner</li>
              <li>• You can invite team members right away</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
