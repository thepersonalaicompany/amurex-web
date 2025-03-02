"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { Users, Building2 } from 'lucide-react';
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/web_app/signin');
        return;
      }

      // Create the team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([
          { 
            team_name: teamName,
            location: location,
          }
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      // Add the creator as an owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([
          {
            team_id: team.id,
            user_id: session.user.id,
            role: 'owner',
            status: 'accepted'
          }
        ]);

      if (memberError) throw memberError;

      toast.success('Team created successfully!');
      router.push(`/teams/${team.id}`);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
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
              Create a Team
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Set up a new team for your organization
            </p>
          </div>

          <hr className="mb-6 border-gray-800" />

          <form onSubmit={handleCreateTeam} className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium font-semibold text-white mb-1">
                Team Name
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Engineering Team"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full py-3 md:py-4 pl-10 pr-3 bg-[#262727] text-white border border-[#262727] text-sm md:text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium font-semibold text-white mb-1">
                Location
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="San Francisco"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full py-3 md:py-4 pl-10 pr-3 bg-[#262727] text-white border border-[#262727] text-sm md:text-base"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !teamName.trim() || !location.trim()}
              className={`w-full p-2.5 md:p-3 text-sm md:text-base font-semibold rounded-lg transition-all duration-200
                ${loading || !teamName.trim() || !location.trim()
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-[#9334E9] text-white hover:bg-[#3c1671] hover:border-[#6D28D9] border border-[#9334E9]'
                }`}
            >
              {loading ? "Creating Team..." : "Create Team"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-[#262727] rounded-lg">
            <h3 className="text-white font-medium mb-2">What happens next?</h3>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>• Your team will be created instantly</li>
              <li>• You'll be added as the team owner</li>
              <li>• You can invite team members right away</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 