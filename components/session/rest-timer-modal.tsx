"use client";

import React, { useState, useEffect } from "react";
import { Timer, X, Plus, Minus, Play, Pause } from "lucide-react";

interface RestTimerProps {
  isOpen: boolean;
  initialSeconds?: number;
  onClose: () => void;
}

export function RestTimerModal({
  isOpen,
  initialSeconds = 90,
  onClose,
}: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(true);
  const [totalTime, setTotalTime] = useState(initialSeconds);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(initialSeconds);
      setTotalTime(initialSeconds);
      setIsActive(true);
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isOpen && isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isOpen) {
      // Audio or vibration cue
      if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isActive, secondsLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = totalTime > 0 ? (totalTime - secondsLeft) / totalTime : 0;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-coral/30 rounded-card-lg p-6 w-full max-w-[340px] flex flex-col items-center relative shadow-glowCoral/30 animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-dim hover:text-text p-1 rounded-full hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-coral/15 flex items-center justify-center">
            <Timer className="w-4 h-4 text-coral" />
          </div>
          <span className="text-sm font-semibold tracking-wider uppercase text-coral font-space">
            Rest Timer
          </span>
        </div>

        {/* Circular Countdown */}
        <div className="relative w-36 h-36 flex items-center justify-center my-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 130 130">
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="8"
            />
            <circle
              cx="65"
              cy="65"
              r={radius}
              fill="none"
              stroke="#FF6E52"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                filter: "drop-shadow(0 0 8px rgba(255, 110, 82, 0.5))",
                transition: "stroke-dashoffset 0.5s ease",
              }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-3xl font-bold text-text tracking-wider">
              {formattedTime}
            </span>
            <span className="text-[11px] text-text-dim mt-0.5">
              {secondsLeft === 0 ? "Time's Up!" : "Remaining"}
            </span>
          </div>
        </div>

        {/* Quick Time Adjusters */}
        <div className="flex items-center gap-3 my-4">
          <button
            onClick={() => {
              setSecondsLeft((s) => Math.max(0, s - 30));
              setTotalTime((t) => Math.max(30, t - 30));
            }}
            className="px-3 py-1.5 rounded-full bg-white/5 border border-border text-xs font-mono text-text-dim hover:text-text hover:border-coral/40 flex items-center gap-1"
          >
            <Minus className="w-3 h-3" /> 30s
          </button>
          <button
            onClick={() => setIsActive(!isActive)}
            className="p-2.5 rounded-full bg-coral/20 border border-coral/40 text-coral hover:bg-coral/30"
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setSecondsLeft((s) => s + 30);
              setTotalTime((t) => t + 30);
            }}
            className="px-3 py-1.5 rounded-full bg-white/5 border border-border text-xs font-mono text-text-dim hover:text-text hover:border-coral/40 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> 30s
          </button>
        </div>

        {/* Done / Skip Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-text font-space text-sm font-semibold transition-colors mt-1"
        >
          {secondsLeft === 0 ? "Ready for Next Set" : "Skip Rest"}
        </button>
      </div>
    </div>
  );
}

