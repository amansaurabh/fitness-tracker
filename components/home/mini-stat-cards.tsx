"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Flame, Activity, Scale, Plus, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MiniStatCardsProps {
  recentDurationText?: string;
  weightToday?: number | null;
  onWeightUpdated?: (newWeight: number) => void;
}

export function MiniStatCards({
  recentDurationText = "52 min",
  weightToday = null,
  onWeightUpdated,
}: MiniStatCardsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [weightInput, setWeightInput] = useState(weightToday ? String(weightToday) : "");
  const [currentWeight, setCurrentWeight] = useState<number | null>(weightToday);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = () => {
    setWeightInput(currentWeight ? String(currentWeight) : "");
    setIsModalOpen(true);
  };

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(weightInput);
    if (isNaN(val) || val <= 0) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/body/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: val }),
      });

      if (res.ok) {
        setCurrentWeight(val);
        setIsModalOpen(false);
        if (onWeightUpdated) onWeightUpdated(val);
      }
    } catch (err) {
      console.error("Failed to save weight:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Cardio Quick Start Card */}
        <Link
          href="/workout/cardio"
          className="bg-surface border border-border rounded-card-sm p-4 card-hover hover:border-coral/40 group flex flex-col justify-between"
        >
          <div>
            <div className="w-8 h-8 rounded-xl bg-coral/15 flex items-center justify-center mb-2.5 shadow-[0_0_12px_rgba(255,110,82,0.15)] group-hover:scale-105 transition-transform">
              <Flame className="w-4 h-4 text-coral" />
            </div>
            <div className="text-[11px] text-text-dim leading-tight">Cardio quick-start</div>
          </div>
          <div className="font-space text-base sm:text-lg font-bold text-text group-hover:text-coral transition-colors flex items-center justify-between mt-2">
            <span>15 min</span>
            <span className="text-[11px] font-mono text-coral font-normal">Start →</span>
          </div>
        </Link>

        {/* Weight Today Card */}
        <div
          onClick={handleOpenModal}
          className="bg-surface border border-border rounded-card-sm p-4 card-hover hover:border-violet/40 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet/15 flex items-center justify-center shadow-[0_0_12px_rgba(123,108,255,0.15)] group-hover:scale-105 transition-transform">
                <Scale className="w-4 h-4 text-violet" />
              </div>
              <span className="text-[10px] font-mono text-lime bg-lime/10 px-1.5 py-0.5 rounded border border-lime/20">
                {currentWeight ? "edit" : "+ log"}
              </span>
            </div>
            <div className="text-[11px] text-text-dim leading-tight">Weight today</div>
          </div>

          <div className="font-space text-base sm:text-lg font-bold text-text font-mono mt-2 group-hover:text-violet transition-colors">
            {currentWeight ? `${currentWeight} kg` : "-- kg"}
          </div>
        </div>

        {/* Last 2 Days Workout Duration */}
        <div className="col-span-2 bg-surface/90 border border-border rounded-card-sm p-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-lime/10 flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-lime" />
            </div>
            <div>
              <div className="text-[10px] text-text-dimmer uppercase tracking-wider">
                Recent Training Activity
              </div>
              <div className="font-space text-xs font-semibold text-text">
                {recentDurationText}
              </div>
            </div>
          </div>
          <Link
            href="/progress"
            className="text-xs font-mono text-text-dim hover:text-lime transition-colors"
          >
            Analytics →
          </Link>
        </div>
      </div>

      {/* Log Body Weight Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface-raised border border-violet/40 rounded-card-lg p-5 w-full max-w-[320px] shadow-glowViolet/20">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet/15 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-violet" />
                </div>
                <h3 className="font-space text-sm font-bold text-text">
                  Log Body Weight
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-dim hover:text-text p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWeight}>
              <label className="block text-xs text-text-dim mb-1.5">
                Weight today (kg)
              </label>
              <div className="relative mb-4">
                <input
                  type="number"
                  step="0.1"
                  autoFocus
                  required
                  placeholder="e.g. 68.5"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 font-mono text-lg text-text focus:outline-none focus:border-violet"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-text-dim">
                  kg
                </span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 rounded-full bg-violet text-text font-space font-semibold text-xs shadow-glowViolet hover:opacity-90 transition-opacity"
              >
                {isSaving ? "Saving..." : "Save Today's Weight"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
