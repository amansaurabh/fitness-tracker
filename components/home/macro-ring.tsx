"use client";

import React from "react";

interface MacroRingProps {
  currentCalories: number;
  targetCalories: number;
  protein: { current: number; target: number };
  carbs: { current: number; target: number };
  fat: { current: number; target: number };
}

export function MacroRing({
  currentCalories = 1840,
  targetCalories = 2400,
  protein = { current: 122, target: 160 },
  carbs = { current: 184, target: 240 },
  fat = { current: 51, target: 65 },
}: Partial<MacroRingProps>) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29
  const percentage = targetCalories > 0 ? Math.min(currentCalories / targetCalories, 1) : 0;
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div className="relative bg-gradient-to-br from-surface-raised to-surface rounded-card-lg p-6 sm:p-7 border border-border overflow-hidden shadow-card">
      {/* Background violet radial ambient glow */}
      <div className="absolute -top-1/2 -right-1/4 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(123,108,255,0.35)_0%,transparent_65%)] blur-md pointer-events-none" />

      <div className="flex items-center gap-6 relative z-10">
        {/* SVG Progress Ring */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            {/* Background Track */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="10"
            />
            {/* Active Lime Ring with Glow */}
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="#CBFF4D"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                filter: "drop-shadow(0 0 10px rgba(203, 255, 77, 0.45))",
                transition: "stroke-dashoffset 0.8s ease-in-out",
              }}
            />
          </svg>

          {/* Center Calories Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="font-space font-bold text-2xl sm:text-[26px] leading-none text-text">
              {Math.round(currentCalories)}
            </span>
            <span className="text-[11px] text-text-dim mt-1">
              of {targetCalories} kcal
            </span>
          </div>
        </div>

        {/* Macro Breakdown List */}
        <div className="flex flex-col gap-3 flex-1">
          {/* Protein */}
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-lime shadow-[0_0_8px_#CBFF4D] flex-shrink-0" />
            <span className="text-xs sm:text-[13px] text-text-dim flex-1">Protein</span>
            <span className="font-mono text-xs sm:text-[13px] font-medium text-text">
              {Math.round(protein.current)}
              <span className="text-text-dimmer">/{protein.target}g</span>
            </span>
          </div>

          {/* Carbs */}
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-coral shadow-[0_0_8px_#FF6E52] flex-shrink-0" />
            <span className="text-xs sm:text-[13px] text-text-dim flex-1">Carbs</span>
            <span className="font-mono text-xs sm:text-[13px] font-medium text-text">
              {Math.round(carbs.current)}
              <span className="text-text-dimmer">/{carbs.target}g</span>
            </span>
          </div>

          {/* Fat */}
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-violet shadow-[0_0_8px_#7B6CFF] flex-shrink-0" />
            <span className="text-xs sm:text-[13px] text-text-dim flex-1">Fat</span>
            <span className="font-mono text-xs sm:text-[13px] font-medium text-text">
              {Math.round(fat.current)}
              <span className="text-text-dimmer">/{fat.target}g</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

