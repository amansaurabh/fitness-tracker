"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Play,
  Pause,
  RotateCcw,
  ArrowLeft,
  Check,
  Plus,
  Minus,
  TrendingUp,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function CardioPage() {
  const router = useRouter();

  // Cardio Telemetry Parameters
  const [targetMinutes, setTargetMinutes] = useState(15);
  const [inclinePct, setInclinePct] = useState(3.0);
  const [speedKmh, setSpeedKmh] = useState(5.5);
  const [userWeightKg, setUserWeightKg] = useState(70);

  // Timer & Session States
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [logged, setLogged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user profile weight for accurate calorie calculation
  useEffect(() => {
    async function fetchWeight() {
      try {
        const res = await fetch("/api/body/weight");
        if (res.ok) {
          const weights = await res.json();
          if (Array.isArray(weights) && weights.length > 0) {
            const latest = weights[weights.length - 1];
            if (latest.weightKg) setUserWeightKg(Number(latest.weightKg));
          }
        }
      } catch (e) {
        // Fallback to default
      }
    }
    fetchWeight();
  }, []);

  // Scientific ACSM metabolic treadmill calorie formula
  // Speed in m/min = speedKmh * (1000 / 60)
  const speedM_min = speedKmh * 16.667;
  const inclineFraction = inclinePct / 100;

  // VO2 in ml/kg/min (ACSM walking vs running threshold at ~6.5 km/h)
  const vo2 =
    speedKmh <= 6.5
      ? 0.1 * speedM_min + 1.8 * speedM_min * inclineFraction + 3.5
      : 0.2 * speedM_min + 0.9 * speedM_min * inclineFraction + 3.5;

  const kcalPerMin = ((vo2 * userWeightKg) / 1000) * 5;
  const totalEstimatedKcal = Math.max(1, Math.round(kcalPerMin * targetMinutes));

  const totalSec = targetMinutes * 60;
  const elapsedSec = totalSec - secondsLeft;
  const liveBurnedKcal = Math.max(
    0,
    Math.round(kcalPerMin * (elapsedSec / 60))
  );

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      setIsCompleted(true);
      handleLogCardio(targetMinutes, totalEstimatedKcal);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft, targetMinutes, totalEstimatedKcal]);

  const handleAdjustTarget = (delta: number) => {
    if (isRunning) return;
    const newTarget = Math.max(1, Math.min(90, targetMinutes + delta));
    setTargetMinutes(newTarget);
    setSecondsLeft(newTarget * 60);
  };

  const handleAdjustIncline = (delta: number) => {
    setInclinePct((prev) =>
      Math.max(0, Math.min(15, Math.round((prev + delta) * 10) / 10))
    );
  };

  const handleAdjustSpeed = (delta: number) => {
    setSpeedKmh((prev) =>
      Math.max(1.0, Math.min(18.0, Math.round((prev + delta) * 10) / 10))
    );
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

  const handleLogCardio = async (minutes: number, calories: number) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/cardio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          durationMinutes: minutes,
          caloriesBurned: calories,
          inclinePct: inclinePct,
          speedKmh: speedKmh,
        }),
      });
      if (res.ok) {
        setLogged(true);
      }
    } catch (err) {
      console.error("Failed to log cardio:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  const progress = (totalSec - secondsLeft) / totalSec;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - progress * circumference;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-4">
        <button
          onClick={() => router.push("/workout")}
          className="p-2 -ml-2 rounded-full text-text-dim hover:text-text hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="font-space text-lg font-bold text-text flex items-center gap-2">
          <Flame className="w-5 h-5 text-coral" />
          <span>Cardio Timer</span>
        </h1>

        <div className="w-8" />
      </div>

      {/* Real-time Calorie Burn Banner */}
      <div className="w-full bg-gradient-to-r from-coral/15 via-surface-raised to-coral/10 border border-coral/30 rounded-card-md p-3.5 mb-5 flex items-center justify-between shadow-[0_0_20px_rgba(255,110,82,0.12)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-coral/20 flex items-center justify-center shadow-glowCoral/30">
            <Flame className="w-5 h-5 text-coral" />
          </div>
          <div>
            <div className="text-[10px] text-text-dim uppercase tracking-wider font-mono">
              Estimated Energy Burn
            </div>
            <div className="font-space text-base sm:text-lg font-bold text-text flex items-baseline gap-1.5">
              <span>{isRunning ? liveBurnedKcal : totalEstimatedKcal}</span>
              <span className="text-xs text-coral font-mono">kcal</span>
              {isRunning && (
                <span className="text-[11px] text-text-dimmer font-normal">
                  / {totalEstimatedKcal} kcal
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-text-dimmer uppercase font-mono">Burn Rate</div>
          <div className="font-mono text-xs font-semibold text-lime">
            ~{kcalPerMin.toFixed(1)} kcal/min
          </div>
        </div>
      </div>

      {/* Main Circular Timer Display */}
      <div className="relative w-60 h-60 sm:w-64 sm:h-64 flex items-center justify-center my-2">
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
              filter: "drop-shadow(0 0 12px rgba(255, 110, 82, 0.55))",
              transition: "stroke-dashoffset 0.5s ease",
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-4xl sm:text-[42px] font-bold text-text tracking-tight">
            {formattedTime}
          </span>
          <span className="text-xs text-text-dim mt-1 font-mono">
            {isCompleted
              ? "Completed! 🏁"
              : isRunning
                ? `${liveBurnedKcal} kcal burned`
                : `${targetMinutes} min · ${speedKmh} km/h · ${inclinePct}% inc`}
          </span>
        </div>
      </div>

      {/* Telemetry Controls (Incline, Speed, Time) */}
      <div className="w-full grid grid-cols-3 gap-2.5 my-4">
        {/* Incline */}
        <div className="bg-surface border border-border rounded-card-sm p-2.5 flex flex-col items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-text-dim mb-1">
            <TrendingUp className="w-3 h-3 text-violet" />
            <span>Incline</span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-text my-0.5">
            {inclinePct}%
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <button
              onClick={() => handleAdjustIncline(-0.5)}
              className="w-6 h-6 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-dim hover:text-text"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAdjustIncline(0.5)}
              className="w-6 h-6 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-dim hover:text-text"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Speed */}
        <div className="bg-surface border border-border rounded-card-sm p-2.5 flex flex-col items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-text-dim mb-1">
            <Gauge className="w-3 h-3 text-lime" />
            <span>Speed</span>
          </div>
          <div className="font-mono text-sm sm:text-base font-bold text-text my-0.5">
            {speedKmh} <span className="text-[10px] font-normal text-text-dim">km/h</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <button
              onClick={() => handleAdjustSpeed(-0.5)}
              className="w-6 h-6 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-dim hover:text-text"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleAdjustSpeed(0.5)}
              className="w-6 h-6 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-dim hover:text-text"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Target Time */}
        <div className="bg-surface border border-border rounded-card-sm p-2.5 flex flex-col items-center justify-between">
          <div className="text-[11px] text-text-dim mb-1">Duration</div>
          <div className="font-mono text-sm sm:text-base font-bold text-text my-0.5">
            {targetMinutes} <span className="text-[10px] font-normal text-text-dim">min</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <button
              disabled={isRunning}
              onClick={() => handleAdjustTarget(-5)}
              className="w-6 h-6 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-dim hover:text-text disabled:opacity-30"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              disabled={isRunning}
              onClick={() => handleAdjustTarget(5)}
              className="w-6 h-6 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-dim hover:text-text disabled:opacity-30"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Action Controls */}
      <div className="flex items-center gap-6 my-3">
        <button
          onClick={handleReset}
          className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-dim hover:text-text hover:border-white/20 transition-colors"
          title="Reset Timer"
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
          onClick={() =>
            handleLogCardio(
              Math.max(1, Math.round(elapsedSec / 60)),
              Math.max(1, liveBurnedKcal || totalEstimatedKcal)
            )
          }
          disabled={isSaving}
          className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-text-dim hover:text-lime hover:border-lime/40 transition-colors disabled:opacity-50"
          title="Log Cardio Now"
        >
          <Check className="w-5 h-5" />
        </button>
      </div>

      {logged && (
        <div className="mt-3 text-xs font-mono text-lime flex items-center gap-1.5 animate-in fade-in">
          <span>✓ {liveBurnedKcal || totalEstimatedKcal} kcal cardio logged to progress!</span>
        </div>
      )}
    </div>
  );
}

