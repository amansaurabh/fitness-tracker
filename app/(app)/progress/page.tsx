"use client";

import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { TrendingUp, Scale, Ruler, Plus, Calendar, Dumbbell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeightPoint {
  loggedAt: string;
  weightKg: number;
}

interface Measurement {
  loggedAt: string;
  chestCm: number | null;
  waistCm: number | null;
  armCm: number | null;
  thighCm: number | null;
}

interface LiftPoint {
  date: string;
  maxWeight: number;
}

export default function ProgressPage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"weight" | "lifts" | "measurements">("weight");
  
  // Real database data
  const [weights, setWeights] = useState<WeightPoint[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [exercisesList, setExercisesList] = useState<string[]>([]);
  const [selectedLift, setSelectedLift] = useState<string>("");
  const [exerciseHistory, setExerciseHistory] = useState<{ [exName: string]: LiftPoint[] }>({});
  const [loading, setLoading] = useState(true);

  // Modals
  const [isLoggingWeight, setIsLoggingWeight] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [isLoggingMeasure, setIsLoggingMeasure] = useState(false);
  const [measureForm, setMeasureForm] = useState({
    chestCm: "",
    waistCm: "",
    armCm: "",
    thighCm: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      const [weightRes, measureRes, sessionsRes] = await Promise.allSettled([
        fetch("/api/body/weight").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/body/measurements").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/sessions").then((r) => (r.ok ? r.json() : [])),
      ]);

      // 1. Process real weight data
      if (weightRes.status === "fulfilled" && Array.isArray(weightRes.value)) {
        setWeights(
          weightRes.value.map((w: any) => ({
            loggedAt: new Date(w.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            weightKg: Number(w.weightKg),
          }))
        );
      }

      // 2. Process real body measurements
      if (measureRes.status === "fulfilled" && Array.isArray(measureRes.value)) {
        setMeasurements(measureRes.value);
      }

      // 3. Process real lift progression from user session sets
      if (sessionsRes.status === "fulfilled" && Array.isArray(sessionsRes.value)) {
        const history: { [exName: string]: LiftPoint[] } = {};
        const names = new Set<string>();

        // Iterate through all sessions in chronological order
        const sortedSessions = [...sessionsRes.value].sort(
          (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
        );

        sortedSessions.forEach((session: any) => {
          const dateStr = new Date(session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          (session.sets || []).forEach((set: any) => {
            const name = set.exerciseName?.trim();
            if (!name) return;
            names.add(name);

            if (!history[name]) history[name] = [];
            const w = Number(set.weightKg);

            const existing = history[name].find((p) => p.date === dateStr);
            if (existing) {
              existing.maxWeight = Math.max(existing.maxWeight, w);
            } else {
              history[name].push({ date: dateStr, maxWeight: w });
            }
          });
        });

        const exArray = Array.from(names);
        setExercisesList(exArray);
        setExerciseHistory(history);

        if (exArray.length > 0 && !selectedLift) {
          setSelectedLift(exArray[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load progress data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeight);
    if (isNaN(val) || val <= 0) return;

    try {
      const res = await fetch("/api/body/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weightKg: val }),
      });

      if (res.ok) {
        setIsLoggingWeight(false);
        setNewWeight("");
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save weight:", err);
    }
  };

  const handleSaveMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/body/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chestCm: measureForm.chestCm ? parseFloat(measureForm.chestCm) : null,
          waistCm: measureForm.waistCm ? parseFloat(measureForm.waistCm) : null,
          armCm: measureForm.armCm ? parseFloat(measureForm.armCm) : null,
          thighCm: measureForm.thighCm ? parseFloat(measureForm.thighCm) : null,
        }),
      });

      if (res.ok) {
        setIsLoggingMeasure(false);
        setMeasureForm({ chestCm: "", waistCm: "", armCm: "", thighCm: "" });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to save measurements:", err);
    }
  };

  // Calculate weight change
  const currentWeightVal = weights.length > 0 ? weights[weights.length - 1].weightKg : null;
  const startWeightVal = weights.length > 0 ? weights[0].weightKg : null;
  const weightDiff = currentWeightVal && startWeightVal ? (currentWeightVal - startWeightVal).toFixed(1) : null;

  const currentLiftData = selectedLift && exerciseHistory[selectedLift] ? exerciseHistory[selectedLift] : [];

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-[12px] text-lime font-semibold tracking-[0.08em] uppercase mb-1">
            Analytics
          </div>
          <h1 className="font-space text-2xl font-bold text-text">Progress Tracker</h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface border border-border rounded-full mb-6">
        <button
          onClick={() => setActiveTab("weight")}
          className={cn(
            "flex-1 py-1.5 rounded-full text-xs font-space font-semibold transition-all",
            activeTab === "weight"
              ? "bg-lime text-bg shadow-glowLime/30"
              : "text-text-dim hover:text-text"
          )}
        >
          Weight Trend
        </button>
        <button
          onClick={() => setActiveTab("lifts")}
          className={cn(
            "flex-1 py-1.5 rounded-full text-xs font-space font-semibold transition-all",
            activeTab === "lifts"
              ? "bg-violet text-text shadow-glowViolet/30"
              : "text-text-dim hover:text-text"
          )}
        >
          Lift Progression
        </button>
        <button
          onClick={() => setActiveTab("measurements")}
          className={cn(
            "flex-1 py-1.5 rounded-full text-xs font-space font-semibold transition-all",
            activeTab === "measurements"
              ? "bg-coral text-bg shadow-glowCoral/30"
              : "text-text-dim hover:text-text"
          )}
        >
          Measurements
        </button>
      </div>

      {/* 1. Body Weight Trend Tab */}
      {activeTab === "weight" && (
        <div className="space-y-4">
          <div className="bg-surface-raised border border-border rounded-card-md p-5 shadow-card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[11px] text-text-dim uppercase tracking-wider">
                  Latest Weight
                </span>
                <div className="font-space text-2xl font-bold text-text">
                  {currentWeightVal ? `${currentWeightVal} kg` : "No entries yet"}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                {weightDiff !== null && (
                  <span className={cn(
                    "text-xs font-mono font-medium",
                    Number(weightDiff) < 0 ? "text-lime" : "text-coral"
                  )}>
                    {Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} kg overall
                  </span>
                )}
                <button
                  onClick={() => setIsLoggingWeight(true)}
                  className="text-xs font-mono text-lime hover:underline flex items-center gap-1 mt-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Weight
                </button>
              </div>
            </div>

            {/* Quick Log Form */}
            {isLoggingWeight && (
              <form onSubmit={handleSaveWeight} className="bg-surface border border-lime/30 rounded-xl p-3.5 mb-4 animate-in fade-in">
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.1"
                    autoFocus
                    required
                    placeholder="Enter weight in kg"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-1.5 font-mono text-xs text-text focus:outline-none focus:border-lime"
                  />
                  <button
                    type="submit"
                    className="py-1.5 px-3 rounded-lg bg-lime text-bg font-space font-semibold text-xs shadow-glowLime"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLoggingWeight(false)}
                    className="text-xs text-text-dim px-1.5"
                  >
                    ✕
                  </button>
                </div>
              </form>
            )}

            {/* Area Chart */}
            {weights.length > 0 ? (
              <div className="w-full h-52 -ml-3">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weights} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="weightGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#CBFF4D" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#CBFF4D" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="loggedAt"
                        stroke="#565962"
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis
                        domain={["dataMin - 1", "dataMax + 1"]}
                        stroke="#565962"
                        fontSize={10}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#14161C",
                          borderColor: "rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#F3F4F0",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="weightKg"
                        stroke="#CBFF4D"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#weightGlow)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-text-dim bg-surface/40 rounded-xl border border-dashed border-border">
                <Scale className="w-8 h-8 text-text-dimmer mx-auto mb-2" />
                <p>No weight logs yet.</p>
                <p className="text-[11px] text-text-dimmer mt-1">
                  Log your daily body weight to view progression curves here!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Lift Progression Tab */}
      {activeTab === "lifts" && (
        <div className="space-y-4">
          <div className="bg-surface-raised border border-border rounded-card-md p-5 shadow-card">
            {exercisesList.length > 0 ? (
              <>
                <div className="mb-4">
                  <label className="block text-[11px] text-text-dim uppercase tracking-wider mb-1.5">
                    Select Exercise
                  </label>
                  <select
                    value={selectedLift}
                    onChange={(e) => setSelectedLift(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-space text-text focus:outline-none focus:border-violet"
                  >
                    {exercisesList.map((name, idx) => (
                      <option key={idx} value={name} className="bg-surface">
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full h-52 -ml-3">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={currentLiftData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="date" stroke="#565962" fontSize={10} tickLine={false} />
                        <YAxis domain={["dataMin - 5", "dataMax + 5"]} stroke="#565962" fontSize={10} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#14161C",
                            borderColor: "rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            fontSize: "12px",
                            color: "#F3F4F0",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="maxWeight"
                          stroke="#7B6CFF"
                          strokeWidth={3}
                          dot={{ fill: "#7B6CFF", r: 4 }}
                          activeDot={{ r: 6, fill: "#CBFF4D" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </>
            ) : (
              <div className="py-10 text-center text-xs text-text-dim bg-surface/40 rounded-xl border border-dashed border-border">
                <Dumbbell className="w-8 h-8 text-text-dimmer mx-auto mb-2" />
                <p>No workout sessions logged yet.</p>
                <p className="text-[11px] text-text-dimmer mt-1">
                  Start an active workout session in Train to track your progressive overload over time!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Weekly Tape Measurements Tab */}
      {activeTab === "measurements" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-dim">Logged weekly</span>
            <button
              onClick={() => setIsLoggingMeasure(!isLoggingMeasure)}
              className="text-xs font-mono text-coral hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Log Entry
            </button>
          </div>

          {isLoggingMeasure && (
            <form
              onSubmit={handleSaveMeasurement}
              className="bg-surface-raised border border-coral/30 rounded-card-md p-4 shadow-glowCoral/10 animate-in fade-in"
            >
              <h4 className="font-space text-sm font-semibold text-text mb-3">
                Weekly Tape Measurements (cm)
              </h4>
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                <input
                  type="number"
                  step="0.5"
                  placeholder="Chest (cm)"
                  value={measureForm.chestCm}
                  onChange={(e) => setMeasureForm({ ...measureForm, chestCm: e.target.value })}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-coral"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Waist (cm)"
                  value={measureForm.waistCm}
                  onChange={(e) => setMeasureForm({ ...measureForm, waistCm: e.target.value })}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-coral"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Arms (cm)"
                  value={measureForm.armCm}
                  onChange={(e) => setMeasureForm({ ...measureForm, armCm: e.target.value })}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-coral"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Thighs (cm)"
                  value={measureForm.thighCm}
                  onChange={(e) => setMeasureForm({ ...measureForm, thighCm: e.target.value })}
                  className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-coral"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-full bg-coral text-bg font-space font-semibold text-xs shadow-glowCoral"
              >
                Save Measurements
              </button>
            </form>
          )}

          {/* Measurements History Table */}
          <div className="bg-surface border border-border rounded-card-md overflow-hidden">
            <div className="grid grid-cols-5 p-3 text-[11px] font-mono uppercase text-text-dimmer border-b border-border text-center">
              <span>Date</span>
              <span>Chest</span>
              <span>Waist</span>
              <span>Arms</span>
              <span>Thighs</span>
            </div>

            {measurements.length > 0 ? (
              measurements.map((m, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-5 p-3 text-xs font-mono text-text border-b border-border/40 text-center"
                >
                  <span className="text-text-dim">{m.loggedAt}</span>
                  <span>{m.chestCm ?? "-"}</span>
                  <span>{m.waistCm ?? "-"}</span>
                  <span>{m.armCm ?? "-"}</span>
                  <span>{m.thighCm ?? "-"}</span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-text-dim">
                <Ruler className="w-7 h-7 text-text-dimmer mx-auto mb-2" />
                <p>No weekly measurements logged yet.</p>
                <p className="text-[11px] text-text-dimmer mt-0.5">
                  Tap &quot;+ Log Entry&quot; to record your tape measurements.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
