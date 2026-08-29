"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Trophy,
  ArrowLeft,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
  X,
  Dumbbell,
} from "lucide-react";
import { RestTimerModal } from "@/components/session/rest-timer-modal";
import { cn } from "@/lib/utils";

interface SetLogRow {
  id?: string;
  setNumber: number;
  weightKg: string;
  reps: string;
  note?: string;
  isPr?: boolean;
  completed?: boolean;
}

interface ExerciseSessionState {
  id?: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  notes?: string;
  lastTimeText?: string;
  sets: SetLogRow[];
}

export default function ActiveSessionPage({
  params,
}: {
  params: { scheduleId: string };
}) {
  const router = useRouter();
  const scheduleId = params.scheduleId;

  const [session, setSession] = useState<any>(null);
  const [exercises, setExercises] = useState<ExerciseSessionState[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRestTimer, setActiveRestTimer] = useState(false);
  const [recentPr, setRecentPr] = useState<{ exercise: string; weight: number } | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [sessionDurationSec, setSessionDurationSec] = useState(0);

  // Modal to add a new custom exercise to the active session
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("3");
  const [newExReps, setNewExReps] = useState("8-12");

  // Summary modal when workout completes
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState<{ totalSets: number; duration: string; prCount: number }>({
    totalSets: 0,
    duration: "00:00",
    prCount: 0,
  });

  // Initialize or resume workout session
  useEffect(() => {
    async function startOrFetchSession() {
      try {
        let activeScheduleId = scheduleId;

        if (scheduleId === "default" || scheduleId === "push-day") {
          const listRes = await fetch("/api/workouts");
          if (listRes.ok) {
            const list = await listRes.json();
            if (list.length > 0) activeScheduleId = list[0].id;
          }
        }

        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduleId: activeScheduleId }),
        });

        if (res.ok) {
          const data = await res.json();
          setSession(data);

          const initialExercises: ExerciseSessionState[] = (
            data.schedule?.exercises || []
          ).map((ex: any) => {
            const plannedSets: SetLogRow[] = Array.from(
              { length: ex.targetSets || 3 },
              (_, i) => ({
                setNumber: i + 1,
                weightKg: "",
                reps: "",
                completed: false,
              })
            );

            return {
              exerciseName: ex.exerciseName,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              notes: ex.notes,
              lastTimeText: null,
              sets: plannedSets,
            };
          });

          setExercises(initialExercises);
        }
      } catch (err) {
        console.error("Failed to start session:", err);
      } finally {
        setLoading(false);
      }
    }

    startOrFetchSession();
  }, [scheduleId]);

  // Session clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDurationSec((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSetChange = (
    exIdx: number,
    setIdx: number,
    field: "weightKg" | "reps" | "note",
    value: string
  ) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exIdx].sets[setIdx][field] = value;
      return updated;
    });
  };

  const handleAddSet = (exIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const nextNum = updated[exIdx].sets.length + 1;
      updated[exIdx].sets.push({
        setNumber: nextNum,
        weightKg: "",
        reps: "",
        completed: false,
      });
      return updated;
    });
  };

  const handleAddNewExerciseToSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const setCount = parseInt(newExSets, 10) || 3;
    const newEx: ExerciseSessionState = {
      exerciseName: newExName.trim(),
      targetSets: setCount,
      targetReps: newExReps.trim() || "8-12",
      sets: Array.from({ length: setCount }, (_, i) => ({
        setNumber: i + 1,
        weightKg: "",
        reps: "",
        completed: false,
      })),
    };

    setExercises((prev) => [...prev, newEx]);
    setNewExName("");
    setNewExSets("3");
    setNewExReps("8-12");
    setIsAddingExercise(false);
  };

  const handleLogSet = async (exIdx: number, setIdx: number) => {
    if (!session) return;
    const currentEx = exercises[exIdx];
    const currentSet = currentEx.sets[setIdx];

    const weight = parseFloat(currentSet.weightKg);
    const reps = parseInt(currentSet.reps, 10);

    if (isNaN(weight) || isNaN(reps)) {
      alert("Please enter both weight (kg) and reps to log set.");
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${session.id}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseName: currentEx.exerciseName,
          setNumber: currentSet.setNumber,
          weightKg: weight,
          reps: reps,
          note: currentSet.note,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        setExercises((prev) => {
          const updated = [...prev];
          updated[exIdx].sets[setIdx].completed = true;
          updated[exIdx].sets[setIdx].isPr = data.isPr;
          if (data.lastTimeReference?.sets?.length) {
            const firstPrior = data.lastTimeReference.sets[0];
            updated[exIdx].lastTimeText = `Last time: ${firstPrior.weightKg}kg × ${firstPrior.reps}`;
          }
          return updated;
        });

        if (data.isPr) {
          setRecentPr({
            exercise: currentEx.exerciseName,
            weight: weight,
          });
          setTimeout(() => setRecentPr(null), 4000);
        }

        // Auto-start in-session rest timer
        setActiveRestTimer(true);
      }
    } catch (err) {
      console.error("Failed to log set:", err);
    }
  };

  const handleFinishWorkout = async () => {
    if (!session) return;
    setIsFinishing(true);

    let completedSetsCount = 0;
    let prs = 0;
    exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          completedSetsCount++;
          if (s.isPr) prs++;
        }
      });
    });

    const min = Math.floor(sessionDurationSec / 60);
    const sec = sessionDurationSec % 60;
    const durStr = `${min}m ${sec}s`;

    setSummaryData({
      totalSets: completedSetsCount,
      duration: durStr,
      prCount: prs,
    });

    try {
      await fetch(`/api/sessions/${session.id}`, {
        method: "PATCH",
      });
      setShowSummaryModal(true);
    } catch (err) {
      console.error("Failed to finish session:", err);
      router.push("/home");
    } finally {
      setIsFinishing(false);
    }
  };

  const minutes = Math.floor(sessionDurationSec / 60);
  const seconds = sessionDurationSec % 60;
  const formattedDuration = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="w-full flex flex-col pb-24">
      {/* Sticky Header */}
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-bg/95 backdrop-blur-md py-2.5 z-20 border-b border-border">
        <button
          onClick={() => router.push("/workout")}
          className="p-1.5 -ml-1 rounded-full text-text-dim hover:text-text hover:bg-white/5"
          title="Back to schedules"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-violet font-semibold uppercase tracking-wider">
            Active Session
          </span>
          <h2 className="font-space text-sm font-bold text-text truncate max-w-[170px]">
            {session?.schedule?.name || "Workout Session"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-mono text-xs text-lime bg-lime/10 px-2 py-0.5 rounded-full border border-lime/20">
            <Clock className="w-3 h-3" />
            <span>{formattedDuration}</span>
          </div>
          <button
            onClick={handleFinishWorkout}
            disabled={isFinishing}
            className="text-xs font-space font-bold bg-lime text-bg px-2.5 py-1 rounded-full shadow-glowLime hover:opacity-90 transition-opacity"
          >
            Finish
          </button>
        </div>
      </div>

      {/* PR Alert Banner */}
      {recentPr && (
        <div className="mb-4 bg-gradient-to-r from-lime/20 via-lime/10 to-transparent border border-lime rounded-card-sm p-3.5 flex items-center gap-3 shadow-glowLime animate-bounce">
          <div className="w-8 h-8 rounded-full bg-lime flex items-center justify-center text-bg font-bold flex-shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="font-space font-bold text-lime text-xs flex items-center gap-1">
              <span>NEW PERSONAL RECORD!</span>
              <Sparkles className="w-3.5 h-3.5 text-lime" />
            </div>
            <div className="text-xs text-text">
              {recentPr.exercise} · {recentPr.weight} kg
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise Drawer */}
      {isAddingExercise && (
        <form
          onSubmit={handleAddNewExerciseToSession}
          className="bg-surface-raised border border-violet/30 rounded-card-md p-4 mb-4 shadow-glowViolet/10 animate-in fade-in"
        >
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-space text-sm font-semibold text-text flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-violet" /> Add Exercise to Session
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingExercise(false)}
              className="text-xs text-text-dim hover:text-text"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 mb-3">
            <input
              type="text"
              required
              placeholder="Exercise Name (e.g. Cable Lateral Raise)"
              value={newExName}
              onChange={(e) => setNewExName(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-violet"
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-text-dim mb-0.5">Target Sets</label>
                <input
                  type="number"
                  value={newExSets}
                  onChange={(e) => setNewExSets(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-xs font-mono text-center text-text focus:outline-none focus:border-violet"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-text-dim mb-0.5">Target Reps</label>
                <input
                  type="text"
                  value={newExReps}
                  onChange={(e) => setNewExReps(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg px-2 py-1 text-xs font-mono text-center text-text focus:outline-none focus:border-violet"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-full bg-violet text-text font-space font-semibold text-xs shadow-glowViolet"
          >
            Add to Workout
          </button>
        </form>
      )}

      {/* Exercises List */}
      <div className="space-y-4 mb-6">
        {exercises.map((ex, exIdx) => (
          <div
            key={exIdx}
            className="bg-surface border border-border rounded-card-md p-4 relative shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-space text-base font-bold text-text">
                  {ex.exerciseName}
                </h3>
                <div className="text-[11px] text-text-dim mt-0.5">
                  Target: {ex.targetSets} sets · {ex.targetReps} reps
                </div>
              </div>

              {ex.lastTimeText && (
                <span className="text-[10px] font-mono text-text-dim bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">
                  {ex.lastTimeText}
                </span>
              )}
            </div>

            {/* Sets Grid */}
            <div className="mt-2.5 space-y-1.5">
              <div className="grid grid-cols-12 gap-1.5 text-[10px] text-text-dimmer uppercase tracking-wider font-mono px-1">
                <span className="col-span-2 text-center">Set</span>
                <span className="col-span-4 text-center">kg</span>
                <span className="col-span-4 text-center">Reps</span>
                <span className="col-span-2 text-center">Log</span>
              </div>

              {ex.sets.map((set, setIdx) => (
                <div
                  key={setIdx}
                  className={cn(
                    "grid grid-cols-12 gap-1.5 items-center rounded-lg p-1 transition-colors",
                    set.completed ? "bg-lime/5 border border-lime/20" : "bg-surface-raised"
                  )}
                >
                  <span className="col-span-2 text-center font-mono font-bold text-xs text-text-dim">
                    {set.setNumber}
                  </span>

                  <input
                    type="number"
                    step="0.5"
                    placeholder="25"
                    disabled={set.completed}
                    value={set.weightKg}
                    onChange={(e) =>
                      handleSetChange(exIdx, setIdx, "weightKg", e.target.value)
                    }
                    className="col-span-4 bg-surface border border-border rounded py-1 px-1.5 text-center font-mono text-xs text-text focus:outline-none focus:border-lime disabled:opacity-80"
                  />

                  <input
                    type="number"
                    placeholder="10"
                    disabled={set.completed}
                    value={set.reps}
                    onChange={(e) =>
                      handleSetChange(exIdx, setIdx, "reps", e.target.value)
                    }
                    className="col-span-4 bg-surface border border-border rounded py-1 px-1.5 text-center font-mono text-xs text-text focus:outline-none focus:border-lime disabled:opacity-80"
                  />

                  <div className="col-span-2 flex justify-center">
                    <button
                      type="button"
                      disabled={set.completed}
                      onClick={() => handleLogSet(exIdx, setIdx)}
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                        set.completed
                          ? "bg-lime text-bg shadow-glowLime/30"
                          : "bg-white/5 border border-border text-text-dim hover:text-lime hover:border-lime"
                      )}
                    >
                      {set.isPr ? (
                        <Trophy className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleAddSet(exIdx)}
              className="mt-2.5 text-[11px] font-mono text-violet hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add set
            </button>
          </div>
        ))}
      </div>

      {/* Add Custom Exercise Button */}
      <button
        onClick={() => setIsAddingExercise(true)}
        className="w-full py-2.5 rounded-card-sm bg-surface border border-dashed border-border hover:border-violet/50 text-xs font-space font-semibold text-text-dim hover:text-text flex items-center justify-center gap-1.5 transition-colors mb-6"
      >
        <Plus className="w-4 h-4 text-violet" />
        <span>Add Exercise to this Workout</span>
      </button>

      {/* Floating Finish Button at Bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[398px] z-30">
        <button
          onClick={handleFinishWorkout}
          disabled={isFinishing}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-lime to-[#9FE050] text-bg font-space font-bold text-sm shadow-glowLime hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isFinishing ? "Saving Session..." : "Finish Workout 🏁"}</span>
        </button>
      </div>

      {/* Rest Timer Modal */}
      <RestTimerModal
        isOpen={activeRestTimer}
        initialSeconds={90}
        onClose={() => setActiveRestTimer(false)}
      />

      {/* Workout Completed Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface-raised border border-lime/40 rounded-card-lg p-6 w-full max-w-[340px] text-center shadow-glowLime/30">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-lime to-[#9FE050] flex items-center justify-center mx-auto mb-3 shadow-glowLime">
              <Trophy className="w-7 h-7 text-bg" />
            </div>

            <h3 className="font-space text-xl font-bold text-text mb-1">
              Workout Complete! 🎉
            </h3>
            <p className="text-xs text-text-dim mb-5">
              Great work! Your session has been saved to your progress.
            </p>

            <div className="grid grid-cols-3 gap-2 bg-surface rounded-xl p-3 border border-border mb-6">
              <div>
                <div className="text-[10px] text-text-dimmer uppercase">Duration</div>
                <div className="font-mono text-sm font-bold text-text mt-0.5">
                  {summaryData.duration}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-text-dimmer uppercase">Sets Logged</div>
                <div className="font-mono text-sm font-bold text-lime mt-0.5">
                  {summaryData.totalSets}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-text-dimmer uppercase">PRs Hit</div>
                <div className="font-mono text-sm font-bold text-violet mt-0.5">
                  {summaryData.prCount} 🏆
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push("/home")}
              className="w-full py-3 rounded-full bg-lime text-bg font-space font-bold text-sm shadow-glowLime hover:opacity-90"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
