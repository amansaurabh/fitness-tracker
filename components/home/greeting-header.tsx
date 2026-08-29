"use client";

import React, { useState } from "react";
import { User, Settings, X, Save, Ruler, Scale, Target, Dumbbell, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface GreetingHeaderProps {
  userName?: string;
  streakDays?: number;
  userProfile?: {
    heightCm?: number | null;
    currentWeightKg?: number | null;
    targetWeightKg?: number | null;
    gymDaysPerWeek?: number | null;
    workoutMinutes?: number | null;
    cardioMinutes?: number | null;
    primaryGoal?: string | null;
  };
  onProfileUpdated?: () => void;
}

export function GreetingHeader({
  userName = "Athlete",
  streakDays = 1,
  userProfile,
  onProfileUpdated,
}: GreetingHeaderProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editName, setEditName] = useState(userName);
  const [editHeight, setEditHeight] = useState(userProfile?.heightCm ? String(userProfile.heightCm) : "175");
  const [editTargetWeight, setEditTargetWeight] = useState(userProfile?.targetWeightKg ? String(userProfile.targetWeightKg) : "75");
  const [editGymDays, setEditGymDays] = useState(userProfile?.gymDaysPerWeek ? String(userProfile.gymDaysPerWeek) : "4");
  const [editWorkoutMins, setEditWorkoutMins] = useState(userProfile?.workoutMinutes ? String(userProfile.workoutMinutes) : "60");
  const [editCardioMins, setEditCardioMins] = useState(userProfile?.cardioMinutes ? String(userProfile.cardioMinutes) : "15");
  const [editGoal, setEditGoal] = useState(userProfile?.primaryGoal || "gain");

  const getGreeting = () => {
    const now = new Date();
    const day = now.toLocaleDateString("en-US", { weekday: "long" });
    const hours = now.getHours();
    let time = "evening";
    if (hours < 12) time = "morning";
    else if (hours < 17) time = "afternoon";

    return `${day}, ${time}`;
  };

  const handleOpenModal = () => {
    setEditName(userName);
    if (userProfile) {
      setEditHeight(userProfile.heightCm ? String(userProfile.heightCm) : "175");
      setEditTargetWeight(userProfile.targetWeightKg ? String(userProfile.targetWeightKg) : "75");
      setEditGymDays(userProfile.gymDaysPerWeek ? String(userProfile.gymDaysPerWeek) : "4");
      setEditWorkoutMins(userProfile.workoutMinutes ? String(userProfile.workoutMinutes) : "60");
      setEditCardioMins(userProfile.cardioMinutes ? String(userProfile.cardioMinutes) : "15");
      setEditGoal(userProfile.primaryGoal || "gain");
    }
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          heightCm: editHeight,
          targetWeightKg: editTargetWeight,
          gymDaysPerWeek: editGymDays,
          workoutMinutes: editWorkoutMins,
          cardioMinutes: editCardioMins,
          primaryGoal: editGoal,
        }),
      });

      if (res.ok) {
        setIsProfileModalOpen(false);
        if (onProfileUpdated) onProfileUpdated();
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="text-[12px] text-text-dim tracking-[0.08em] uppercase mb-1 font-medium">
            {getGreeting()}
          </div>
          <h1 className="font-space text-2xl sm:text-[26px] font-semibold text-text flex items-center gap-2">
            <span>Ready, {userName}?</span>
            <button
              onClick={handleOpenModal}
              className="text-text-dimmer hover:text-lime transition-colors p-1"
              title="Edit Profile & Targets"
            >
              <Settings className="w-4 h-4" />
            </button>
          </h1>
        </div>

        <div className="flex items-center gap-1.5 bg-gradient-to-br from-lime/15 to-lime/[0.03] border border-lime/25 rounded-full py-1.5 px-3 font-mono text-xs font-bold text-lime shadow-glowLime/20">
          <span>🔥</span>
          <span>{streakDays} day streak</span>
        </div>
      </div>

      {/* Edit Profile & Targets Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-raised border border-violet/30 rounded-card-lg p-5 w-full max-w-[360px] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-space text-base font-bold text-text flex items-center gap-2">
                <User className="w-4 h-4 text-violet" />
                <span>Profile & Goals</span>
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-text-dim hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-[11px] text-text-dim mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 text-xs text-text focus:outline-none focus:border-lime"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-text-dim mb-1">Height (cm)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 font-mono text-xs text-text focus:outline-none focus:border-lime"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-dim mb-1">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editTargetWeight}
                    onChange={(e) => setEditTargetWeight(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-1.5 font-mono text-xs text-text focus:outline-none focus:border-lime"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-text-dim mb-1">Gym Days/Week</label>
                  <select
                    value={editGymDays}
                    onChange={(e) => setEditGymDays(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-2 py-1.5 font-mono text-xs text-text focus:outline-none focus:border-lime"
                  >
                    <option value="3">3 Days</option>
                    <option value="4">4 Days</option>
                    <option value="5">5 Days</option>
                    <option value="6">6 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text-dim mb-1">Cardio Goal</label>
                  <select
                    value={editCardioMins}
                    onChange={(e) => setEditCardioMins(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-2 py-1.5 font-mono text-xs text-text focus:outline-none focus:border-coral"
                  >
                    <option value="10">10 min</option>
                    <option value="15">15 min</option>
                    <option value="20">20 min</option>
                    <option value="30">30 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-text-dim mb-1">Primary Goal</label>
                <select
                  value={editGoal}
                  onChange={(e) => setEditGoal(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-2 py-1.5 text-xs text-text focus:outline-none focus:border-violet"
                >
                  <option value="gain">Muscle Gain (+300 kcal)</option>
                  <option value="loss">Fat Loss (-400 kcal)</option>
                  <option value="recomp">Body Recomposition</option>
                  <option value="maintain">Maintenance</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-full bg-lime text-bg font-space font-semibold text-xs shadow-glowLime mt-4 flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Profile & Goals"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
