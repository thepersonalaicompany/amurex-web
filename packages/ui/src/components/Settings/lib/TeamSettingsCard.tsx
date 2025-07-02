"use client";

import { Button, Card, CardContent } from "@amurex/ui/components";
import { useSettingsStore } from "@amurex/ui/store";
import { Pencil, UserPlus } from "lucide-react";

export const TeamSettingsCard = () => {
  const {
    activeTab,
    editingField,
    teamName,
    editedName,
    setEditedName,
    setEditingField,
    editedLocation,
    setEditedLocation,
    teamLocation,
    teamCreatedAt,
    setEditingMemberId,
    setEditedRole,
    handleRoleUpdate,
    currentUserRole,
    editingMemberId,
    editedRole,
    getInitials,
    setIsInviteModalOpen,
    teamMembers,
    membersLoading,
    handleSave,
  } = useSettingsStore();
  return (
    <>
      {activeTab === "team" && (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-medium text-white">Team Settings</h1>

            <Card className="bg-black border-zinc-800">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-md text-zinc-400">Team Name</h3>
                        {editingField === "name" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave("name")}
                              className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-zinc-800 text-white hover:bg-zinc-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave("name")}
                              className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] hover:!bg-[#3c1671]"
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setEditingField("name")}
                            className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:!bg-[#3c1671] hover:border-[#6D28D9]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {editingField === "name" ? (
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#9334E9] focus:border-transparent"
                        />
                      ) : (
                        <p className="text-white">{teamName}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-md text-zinc-400">Location</h3>
                        {editingField === "location" ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSave("location")}
                              className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-zinc-800 text-white hover:bg-zinc-700"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave("location")}
                              className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] hover:!bg-[#3c1671]"
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setEditingField("location")}
                            className="mt-2 lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:!bg-[#3c1671] hover:border-[#6D28D9]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {editingField === "location" ? (
                        <input
                          type="text"
                          value={editedLocation}
                          onChange={(e) => setEditedLocation(e.target.value)}
                          className="mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#9334E9] focus:border-transparent"
                        />
                      ) : (
                        <p className="text-white">{teamLocation}</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-md text-zinc-400">Created Date</h3>
                      <p className="text-white">{teamCreatedAt}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 mt-8 border-t border-zinc-800 pt-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-medium text-white">Members</h1>
              <Button
                onClick={() => setIsInviteModalOpen(true)}
                className="lg:px-4 lg:py-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] cursor-pointer transition-all duration-200 whitespace-nowrap hover:!bg-[#3c1671] hover:border-[#6D28D9]"
              >
                <UserPlus className="h-4 w-4" />
                Invite Members
              </Button>
            </div>

            <Card className="bg-black border-zinc-800">
              <CardContent className="p-6">
                {membersLoading ? (
                  <div className="text-zinc-400">Loading members...</div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-zinc-400">No members found</div>
                ) : (
                  <div className="space-y-6">
                    {teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between border-b border-zinc-800 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-zinc-800 rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium text-[#a774ee] border border-[#a774ee]">
                            {getInitials(
                              member.name || "",
                              member.users?.email || "",
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {member.name || member.users?.email}{" "}
                              <b>({member.users?.email || member.name})</b>
                            </p>
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                              {editingMemberId === member.id ? (
                                <select
                                  value={editedRole}
                                  onChange={(e) =>
                                    setEditedRole(e.target.value)
                                  }
                                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white"
                                >
                                  <option value="owner">Owner</option>
                                  <option value="member">Member</option>
                                </select>
                              ) : (
                                <span className="capitalize">
                                  {member.role}
                                </span>
                              )}
                              <span>•</span>
                              <span>
                                Joined{" "}
                                {new Date(member.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        {currentUserRole === "owner" && (
                          <div className="flex gap-2">
                            {editingMemberId === member.id ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => setEditingMemberId(null)}
                                  className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 bg-zinc-800 text-white hover:bg-zinc-700"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleRoleUpdate(member.id)}
                                  className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] hover:!bg-[#3c1671]"
                                >
                                  Save
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEditingMemberId(member.id);
                                  setEditedRole(member.role);
                                }}
                                className="mt-2 px-2 py-2 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-white/10 !bg-[#9334E9] text-[#FAFAFA] hover:!bg-[#3c1671]"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit Role
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
};
