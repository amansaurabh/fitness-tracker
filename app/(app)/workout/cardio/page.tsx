"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flame, Play, Pause, RotateCcw, ArrowLeft, Check, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function CardioPage() {
  const router = useRouter();
  const [targetMinutes, setTargetMinutes] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsCompleted(true);
      handleLogCardio(targetMinutes);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, targetMinutes]);

  const handleAdjustTarget = (delta: number) => {
    if (isRunning) return;
    const newTarget = Math.max(1, targetMinutes + delta);
    setTargetMinutes(newTarget);
    setSecondsLeft(newTarget * 60);
  };

  const handleToggleTimer = () => {
    if (isCompleted) {
      setSecondsLeft(targetMinutes * 60);
      setIsCompleted(false);
      setLogged(false);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(targetMinutes * 60);
    setIsCompleted(false);
  };

  const handleLogCardio = async (minutes: number) => {
    try {
      const res = await fetch("/api/cardio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationMinutes: minutes }),
      });
      if (res.ok) {
        setLogged(true);
      }
    } catch (err) {
      console.error("Failed to log cardio:", err);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalSec = targetMinutes * 60;
  const progress = (totalSec - secondsLeft) / totalSec;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - progress * circumference;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <button
          onClick={() => router.push("/workout")}
          className="p-2 -ml-2 rounded-full text-text-dim hover:text-text hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="font-space text-lg font-bold text-text">Cardio Session</h1>

        <div className="w-8" />
      </div>

      {/* Main Timer Display */}
      <div className="relative w-64 h-64 flex items-center justify-center my-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="10"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#FF6E52"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            style={{
              filter: "drop-shadow(0 0 12px rgba(255, 110, 82, 0.5))",
              transition: "stroke-dashoffset 0.5s ease",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-xl bg-coral/15 flex items-center justify-center mb-2 shadow-[0_0_16px_rgba(255,110,82,0.2)]">
            <Flame className="w-5 h-5 text-coral" />
          </div>
          <span className="font-mono text-4xl font-bold text-text tracking-tight">
            {formattedTime}
          </span>
          <span className="text-xs text-text-dim mt-1">
            {isCompleted ? "Completed!" : `${targetMinutes} min workout`}
          </span>
        </div>
      </div>

      {/* Target Adjuster */}
      {!isRunning && !isCompleted && (
        <div className="flex items-center gap-4 mb-8 bg-surface border border-border rounded-full py-2 px-5">
          <button
            onClick={() => handleAdjustTarget(-5)}
            className="text-text-dim hover:text-text p-1"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="font-mono text-sm font-semibold text-text">
            {targetMinutes} minutes
          </span>
          <button
            onClick={() => handleAdjustTarget(5)}
            className="text-text-dim hover:text-text p-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-6 my-4">
        <button
          onClick={handleReset}
          className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-dim hover:text-text hover:border-white/20 transition-colors"
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={handleToggleTimer}
          className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-glowCoral",
            isRunning
              ? "bg-surface border border-coral text-coral"
              : "bg-gradient-to-br from-coral to-[#E05030] text-bg"
          )}
        >
          {isRunning ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current translate-x-0.5" />
          )}
        </button>

        <button
          onClick={() => handleLogCardio(Math.round((totalSec - secondsLeft) / 60) || 1)}
          className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-dim hover:text-lime hover:border-lime/40 transition-colors"
          title="Log now"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>

      {logged && (
        <div className="mt-4 text-xs font-mono text-lime flex items-center gap-1.5 animate-in fade-in">
          <span>✓ Cardio session logged to progress!</span>
        </div>
      )}
    </div>
  );
}

