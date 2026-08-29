"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User,
  Ruler,
  Scale,
  Target,
  Dumbbell,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: Body Stats
  const [heightCm, setHeightCm] = useState("175");
  const [currentWeightKg, setCurrentWeightKg] = useState("70");
  const [targetWeightKg, setTargetWeightKg] = useState("75");

  // Step 3: Gym & Goals
  const [gymDays, setGymDays] = useState("4");
  const [workoutMins, setWorkoutMins] = useState("60");
  const [cardioMins, setCardioMins] = useState("15");
  const [goal, setGoal] = useState<"gain" | "loss" | "maintain" | "recomp">("gain");

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all account fields");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!heightCm || !currentWeightKg) {
      setError("Please enter your height and current weight");
      return;
    }
    setError("");
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          heightCm,
          currentWeightKg,
          targetWeightKg,
          gymDaysPerWeek: gymDays,
          workoutMinutes: workoutMins,
          cardioMinutes: cardioMins,
          primaryGoal: goal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Auto sign-in
      const { signIn } = await import("next-auth/react");
      const loginRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        // Redirect to login if credentials mismatch
        router.push("/login");
      } else {
        router.push("/home");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[85vh] flex flex-col justify-center items-center px-2 py-6">
      <div className="w-full max-w-[390px] bg-surface-raised border border-border rounded-card-lg p-6 sm:p-7 shadow-card relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-lime/20 rounded-full blur-2xl pointer-events-none" />

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  s === step
                    ? "w-8 bg-lime shadow-glowLime"
                    : s < step
                      ? "w-4 bg-lime/60"
                      : "w-4 bg-white/10"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono text-text-dim">
            Step {step} of 3
          </span>
        </div>

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-space text-2xl font-bold text-text">
            {step === 1 && "Create Your Account"}
            {step === 2 && "Your Body Metrics"}
            {step === 3 && "Your Fitness Routine"}
          </h1>
          <p className="text-xs text-text-dim mt-1 font-inter">
            {step === 1 && "Let's set up your profile and personalized tracker."}
            {step === 2 && "We use this to calculate your daily calories & macros."}
            {step === 3 && "Customize your gym schedule, cardio goals & targets."}
          </p>
        </div>

        {error && (
          <div className="bg-coral/10 border border-coral/30 rounded-xl p-2.5 mb-4 text-xs text-coral font-mono text-center">
            {error}
          </div>
        )}

        {/* STEP 1: Account Info */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="space-y-3.5 animate-in fade-in">
            <div>
              <label className="block text-xs text-text-dim mb-1 font-medium">
                Your Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-text focus:outline-none focus:border-lime"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-dim mb-1 font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-text focus:outline-none focus:border-lime"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-dim mb-1 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-text focus:outline-none focus:border-lime"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-lime text-bg font-space font-bold text-sm shadow-glowLime hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-5"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Body Metrics */}
        {step === 2 && (
          <form onSubmit={handleNextStep2} className="space-y-3.5 animate-in fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-dim mb-1 font-medium">
                  Height (cm)
                </label>
                <div className="relative">
                  <Ruler className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="175"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 font-mono text-xs text-text focus:outline-none focus:border-lime"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-dim mb-1 font-medium">
                  Current Weight (kg)
                </label>
                <div className="relative">
                  <Scale className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="70.5"
                    value={currentWeightKg}
                    onChange={(e) => setCurrentWeightKg(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 font-mono text-xs text-text focus:outline-none focus:border-lime"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-dim mb-1 font-medium">
                Target Goal Weight (kg)
              </label>
              <div className="relative">
                <Target className="w-4 h-4 text-text-dim absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.1"
                  placeholder="75.0"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl pl-9 pr-3.5 py-2.5 font-mono text-xs text-text focus:outline-none focus:border-lime"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-full bg-white/5 border border-border text-text-dim hover:text-text font-space text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                className="flex-1 py-3 rounded-full bg-lime text-bg font-space font-bold text-sm shadow-glowLime hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Training & Routine */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4 animate-in fade-in">
            {/* Primary Goal Pill selector */}
            <div>
              <label className="block text-xs text-text-dim mb-1.5 font-medium">
                Primary Goal
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "gain", label: "Muscle Gain", desc: "+300 kcal surplus" },
                  { key: "loss", label: "Fat Loss", desc: "-400 kcal deficit" },
                  { key: "recomp", label: "Body Recomp", desc: "High protein maintenance" },
                  { key: "maintain", label: "Maintenance", desc: "Energy balance" },
                ].map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGoal(g.key as any)}
                    className={cn(
                      "p-2.5 rounded-xl text-left border transition-all",
                      goal === g.key
                        ? "bg-violet/15 border-violet text-text shadow-glowViolet/20"
                        : "bg-surface border-border text-text-dim hover:border-white/20"
                    )}
                  >
                    <div className="font-space text-xs font-semibold text-text">
                      {g.label}
                    </div>
                    <div className="text-[10px] text-text-dimmer mt-0.5 font-mono">
                      {g.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gym Frequency */}
            <div>
              <label className="block text-xs text-text-dim mb-1.5 font-medium">
                Gym Frequency (Days / Week)
              </label>
              <div className="flex gap-2">
                {["3", "4", "5", "6"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setGymDays(d)}
                    className={cn(
                      "flex-1 py-2 rounded-xl font-mono text-xs font-bold border transition-all",
                      gymDays === d
                        ? "bg-lime text-bg border-lime shadow-glowLime"
                        : "bg-surface border-border text-text-dim hover:text-text"
                    )}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Workout & Cardio Durations */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-text-dim mb-1 font-medium">
                  Workout Length
                </label>
                <select
                  value={workoutMins}
                  onChange={(e) => setWorkoutMins(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-2.5 py-2 font-mono text-xs text-text focus:outline-none focus:border-lime"
                >
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="75">75 min</option>
                  <option value="90">90 min</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-text-dim mb-1 font-medium">
                  Daily Cardio
                </label>
                <select
                  value={cardioMins}
                  onChange={(e) => setCardioMins(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl px-2.5 py-2 font-mono text-xs text-text focus:outline-none focus:border-coral"
                >
                  <option value="10">10 min</option>
                  <option value="15">15 min (Standard)</option>
                  <option value="20">20 min</option>
                  <option value="30">30 min</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-full bg-white/5 border border-border text-text-dim hover:text-text font-space text-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-full bg-gradient-to-r from-lime to-[#9FE050] text-bg font-space font-bold text-sm shadow-glowLime hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-bg" />
                <span>{loading ? "Generating Profile..." : "Get Started 🚀"}</span>
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-text-dim">
          Already have an account?{" "}
          <Link href="/login" className="text-lime hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
