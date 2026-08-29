"use client";

import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";

interface TodayWorkoutCardProps {
  scheduleId?: string;
  dayLabel?: string;
  title?: string;
  exercises?: string[];
}

export function TodayWorkoutCard({
  scheduleId = "default",
  dayLabel = "Day 3 · Push",
  title = "Chest, shoulders & triceps",
  exercises = ["Incline DB press", "Shoulder press", "Pec dec", "+4 more"],
}: TodayWorkoutCardProps) {
  return (
    <div className="mb-4">
      <div className="text-[12px] font-semibold tracking-[0.06em] uppercase text-text-dimmer mb-3 ml-1">
        Today&apos;s workout
      </div>

      <Link
        href={`/workout/${scheduleId}/session`}
        className="block relative bg-gradient-to-br from-[#1c1430] via-[#161424] to-[#14161c] border border-violet/30 rounded-card-md p-5 sm:p-5 overflow-hidden card-hover hover:border-violet/50 hover:shadow-[0_16px_40px_-12px_rgba(123,108,255,0.35)] cursor-pointer group"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-[11px] text-violet font-semibold tracking-[0.08em] uppercase mb-1">
              {dayLabel}
            </div>
            <div className="font-space text-lg sm:text-xl font-semibold text-text group-hover:text-white transition-colors">
              {title}
            </div>
          </div>

          <div className="w-11 h-11 rounded-full flex-shrink-0 bg-gradient-to-br from-lime to-[#9FE050] flex items-center justify-center shadow-glowLime group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 fill-bg text-bg translate-x-0.5" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {exercises.map((exercise, idx) => (
            <span
              key={idx}
              className="text-xs text-text-dim bg-white/[0.04] border border-border rounded-full py-1.5 px-3"
            >
              {exercise}
            </span>
          ))}
        </div>
      </Link>
    </div>
  );
}

