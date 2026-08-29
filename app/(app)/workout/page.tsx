"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Play,
  Dumbbell,
  Flame,
  ChevronRight,
  Trash2,
  Edit3,
  X,
  History,
  Trophy,
  Calendar,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Exercise {
  id?: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  notes?: string;
}

interface Schedule {
  id: string;
  name: string;
  exercises: Exercise[];
}

export const dynamic = "force-dynamic";

export default function WorkoutOverviewPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState("");
  const [exercisesList, setExercisesList] = useState<Exercise[]>([
    { exerciseName: "", targetSets: 3, targetReps: "8-12" },
  ]);

  // History modal state
  const [historyModalSchedule, setHistoryModalSchedule] = useState<Schedule | null>(null);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/workouts");
      if (res.ok) {
        const data = await res.json();
        setSchedules(data);
      }
    } catch (err) {
      console.error("Failed to load schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleOpenCreate = () => {
    setEditingScheduleId(null);
    setScheduleName("");
    setExercisesList([{ exerciseName: "", targetSets: 3, targetReps: "8-12" }]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sched: Schedule) => {
    setEditingScheduleId(sched.id);
    setScheduleName(sched.name);
    setExercisesList(
      sched.exercises.length > 0
        ? sched.exercises.map((e) => ({
          exerciseName: e.exerciseName,
          targetSets: e.targetSets,
          targetReps: e.targetReps,
          notes: e.notes,
        }))
        : [{ exerciseName: "", targetSets: 3, targetReps: "8-12" }]
    );
    setIsFormOpen(true);
  };

  const handleAddExerciseRow = () => {
    setExercisesList((prev) => [
      ...prev,
      { exerciseName: "", targetSets: 3, targetReps: "8-12" },
    ]);
  };

  const handleExerciseChange = (
    index: number,
    field: keyof Exercise,
    value: any
  ) => {
    setExercisesList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveExerciseRow = (index: number) => {
    setExercisesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchSchedules();
      }
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  };

  const handleOpenHistory = async (sched: Schedule) => {
    setHistoryModalSchedule(sched);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/workouts/${sched.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistorySessions(data.history || []);
      } else {
        setHistorySessions([]);
      }
    } catch (err) {
      console.error("Failed to load workout history:", err);
      setHistorySessions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName.trim()) {
      setFormError("Please enter a schedule name");
      return;
    }

    const validExercises = exercisesList.filter(
      (e) => e.exerciseName && e.exerciseName.trim().length > 0
    );

    setIsSaving(true);
    setFormError("");

    try {
      const url = editingScheduleId
        ? `/api/workouts/${editingScheduleId}`
        : "/api/workouts";
      const method = editingScheduleId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scheduleName.trim(),
          exercises: validExercises,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setIsFormOpen(false);
        fetchSchedules();
      } else {
        setFormError(data.error || "Failed to save schedule");
      }
    } catch (err) {
      console.error("Failed to save schedule:", err);
      setFormError("Network error occurred while saving schedule");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="text-[12px] text-violet font-semibold tracking-[0.08em] uppercase mb-1">
            Training
          </div>
          <h1 className="font-space text-2xl font-bold text-text">
            Workout Schedules
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-lime hover:bg-lime/90 text-bg font-space font-semibold text-xs py-2 px-3.5 rounded-full shadow-glowLime/40 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Schedule</span>
        </button>
      </div>

      {/* Schedule Form Modal / Drawer */}
      {isFormOpen && (
        <form
          onSubmit={handleSaveSchedule}
          className="bg-surface-raised border border-lime/30 rounded-card-md p-5 mb-6 shadow-glowLime/10 animate-in fade-in slide-in-from-top-3"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-space text-base font-semibold text-text">
              {editingScheduleId ? "Edit Schedule" : "Create Custom Schedule"}
            </h3>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-xs text-text-dim hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-text-dim mb-1.5 font-medium">
              Schedule Name (e.g. Push, Pull, Legs, Upper, Lower)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Push (Chest & Shoulders)"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-3.5 py-2.5 text-sm font-space text-text placeholder:text-text-dimmer focus:outline-none focus:border-lime"
            />
          </div>

          <div className="space-y-3 mb-4">
            <label className="block text-xs text-text-dim font-medium">
              Exercises
            </label>
            {exercisesList.map((ex, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Exercise Name"
                  value={ex.exerciseName}
                  onChange={(e) =>
                    handleExerciseChange(idx, "exerciseName", e.target.value)
                  }
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-lime"
                />
                <input
                  type="number"
                  placeholder="Sets"
                  value={ex.targetSets}
                  onChange={(e) =>
                    handleExerciseChange(idx, "targetSets", e.target.value)
                  }
                  className="w-14 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-center text-text focus:outline-none focus:border-lime"
                />
                <input
                  type="text"
                  placeholder="Reps"
                  value={ex.targetReps}
                  onChange={(e) =>
                    handleExerciseChange(idx, "targetReps", e.target.value)
                  }
                  className="w-16 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs font-mono text-center text-text focus:outline-none focus:border-lime"
                />
                {exercisesList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveExerciseRow(idx)}
                    className="p-1.5 text-text-dimmer hover:text-coral"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddExerciseRow}
              className="text-xs font-mono text-lime hover:underline pt-1 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add another exercise
            </button>
          </div>

          {formError && (
            <div className="bg-coral/10 border border-coral/30 rounded-xl p-2.5 mb-4 text-xs text-coral font-mono">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-2.5 rounded-full bg-lime text-bg font-space font-semibold text-sm hover:opacity-90 shadow-glowLime transition-opacity disabled:opacity-50"
          >
            {isSaving
              ? "Saving..."
              : editingScheduleId
                ? "Update Schedule"
                : "Save Schedule"}
          </button>
        </form>
      )}

      {/* Schedules List */}
      <div className="space-y-4 mb-6">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-surface border border-border rounded-card-md p-5 card-hover hover:border-violet/40 relative overflow-hidden group"
          >
            <div className="flex justify-between items-start mb-3">
              <div
                className="cursor-pointer flex-1 mr-3"
                onClick={() => handleOpenHistory(schedule)}
              >
                <h3 className="font-space text-lg font-semibold text-text group-hover:text-violet transition-colors">
                  {schedule.name}
                </h3>
                <div className="text-xs text-text-dim mt-0.5">
                  {schedule.exercises.length} planned exercises
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(schedule)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-dim hover:text-text hover:border-white/20 transition-colors"
                  title="Edit schedule"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-border flex items-center justify-center text-text-dim hover:text-coral hover:border-coral/40 transition-colors"
                  title="Delete schedule"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <Link
                  href={`/workout/${schedule.id}/session`}
                  className="w-10 h-10 rounded-full bg-lime flex items-center justify-center shadow-glowLime group-hover:scale-105 transition-transform"
                  title="Start Workout"
                >
                  <Play className="w-4 h-4 fill-bg text-bg translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Exercise preview pills */}
            <div
              className="flex flex-wrap gap-1.5 pt-1 cursor-pointer"
              onClick={() => handleOpenHistory(schedule)}
            >
              {schedule.exercises.map((ex, idx) => (
                <span
                  key={idx}
                  className="text-[11px] text-text-dim bg-white/[0.03] border border-border rounded-full py-1 px-2.5 font-inter"
                >
                  {ex.exerciseName} ({ex.targetSets}×{ex.targetReps})
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cardio Section Link */}
      <div className="mt-2">
        <div className="text-[12px] font-semibold tracking-[0.06em] uppercase text-text-dimmer mb-3 ml-1">
          Cardio & Conditioning
        </div>
        <Link
          href="/workout/cardio"
          className="bg-gradient-to-r from-surface to-[#201518] border border-coral/30 rounded-card-sm p-4 flex items-center justify-between card-hover hover:border-coral/60 group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-coral/15 flex items-center justify-center shadow-[0_0_16px_rgba(255,110,82,0.2)] group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-coral" />
            </div>
            <div>
              <div className="font-space text-base font-semibold text-text group-hover:text-coral transition-colors">
                Cardio Timer
              </div>
              <div className="text-xs text-text-dim">
                Incline · Speed · Live Calorie Burn Calculator
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-dimmer group-hover:text-coral transition-colors" />
        </Link>
      </div>

      {/* Workout History Modal */}
      {historyModalSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface border border-violet/40 rounded-card-lg p-5 w-full max-w-[480px] max-h-[85vh] flex flex-col shadow-glowViolet/20">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-border">
              <div>
                <div className="text-[11px] text-violet font-semibold uppercase tracking-wider font-mono flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> Progression History
                </div>
                <h3 className="font-space text-lg font-bold text-text">
                  {historyModalSchedule.name}
                </h3>
              </div>

              <button
                onClick={() => setHistoryModalSchedule(null)}
                className="p-1 rounded-full text-text-dim hover:text-text hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {historyLoading ? (
                <div className="py-12 text-center text-xs font-mono text-text-dim animate-pulse">
                  Loading progression history...
                </div>
              ) : historySessions.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-text-dimmer mb-3">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="font-space text-sm font-semibold text-text mb-1">
                    No Sessions Recorded Yet
                  </div>
                  <p className="text-xs text-text-dim max-w-[260px] text-center mb-4">
                    Complete your first {historyModalSchedule.name} workout to begin tracking progressive overload!
                  </p>
                  <Link
                    href={`/workout/${historyModalSchedule.id}/session`}
                    className="py-2 px-5 rounded-full bg-lime text-bg font-space font-semibold text-xs shadow-glowLime"
                  >
                    Start Workout Now
                  </Link>
                </div>
              ) : (
                <>
                  {/* Summary Bar */}
                  <div className="grid grid-cols-3 gap-2 bg-surface-raised border border-border rounded-xl p-3">
                    <div>
                      <div className="text-[10px] text-text-dimmer uppercase font-mono">Sessions</div>
                      <div className="font-mono text-sm font-bold text-text mt-0.5">
                        {historySessions.length} logged
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-dimmer uppercase font-mono">Peak Volume</div>
                      <div className="font-mono text-sm font-bold text-lime mt-0.5">
                        {Math.max(...historySessions.map((s) => s.totalVolumeKg || 0))} kg
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-text-dimmer uppercase font-mono">PRs Hit</div>
                      <div className="font-mono text-sm font-bold text-violet mt-0.5">
                        {historySessions.reduce((acc, s) => acc + (s.prCount || 0), 0)} 🏆
                      </div>
                    </div>
                  </div>

                  {/* Past Sessions List */}
                  <div className="space-y-3">
                    <div className="text-[11px] text-text-dim font-mono uppercase tracking-wider">
                      Recent Completed Sessions
                    </div>

                    {historySessions.map((sess, idx) => (
                      <div
                        key={sess.sessionId || idx}
                        className="bg-surface-raised border border-border rounded-card-sm p-3.5"
                      >
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                          <div className="flex items-center gap-1.5 text-xs text-text font-medium">
                            <Calendar className="w-3.5 h-3.5 text-text-dim" />
                            <span>
                              {new Date(sess.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-lime font-semibold">
                              {sess.totalVolumeKg} kg vol
                            </span>
                            {sess.prCount > 0 && (
                              <span className="text-[10px] bg-violet/20 text-violet px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> {sess.prCount} PR
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Exercise Sets in Session */}
                        <div className="space-y-1.5">
                          {sess.exercises?.map((ex: any, exIdx: number) => (
                            <div
                              key={exIdx}
                              className="flex justify-between items-center text-xs py-0.5"
                            >
                              <span className="text-text-dim truncate max-w-[170px]">
                                {ex.exerciseName}
                              </span>
                              <span className="font-mono text-text text-[11px]">
                                {ex.sets.map((s: any) => `${s.weightKg}kg×${s.reps}`).join(", ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer Action */}
            <div className="mt-4 pt-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setHistoryModalSchedule(null)}
                className="py-2 px-4 rounded-full border border-border text-text-dim hover:text-text text-xs font-space"
              >
                Close
              </button>
              <Link
                href={`/workout/${historyModalSchedule.id}/session`}
                className="py-2 px-5 rounded-full bg-lime text-bg font-space font-bold text-xs shadow-glowLime hover:opacity-90 flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Workout</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
