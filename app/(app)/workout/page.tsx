"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Play, Dumbbell, Flame, ChevronRight, Trash2, Edit3, X } from "lucide-react";
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
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState("");
  const [exercisesList, setExercisesList] = useState<Exercise[]>([
    { exerciseName: "", targetSets: 3, targetReps: "8-12" },
  ]);

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

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName.trim()) return;

    const validExercises = exercisesList.filter(
      (e) => e.exerciseName.trim().length > 0
    );

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

      if (res.ok) {
        setIsFormOpen(false);
        fetchSchedules();
      }
    } catch (err) {
      console.error("Failed to save schedule:", err);
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

          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-lime text-bg font-space font-semibold text-sm hover:opacity-90 shadow-glowLime transition-opacity"
          >
            {editingScheduleId ? "Update Schedule" : "Save Schedule"}
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
              <div>
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
            <div className="flex flex-wrap gap-1.5 pt-1">
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
                15-Min Cardio Timer
              </div>
              <div className="text-xs text-text-dim">
                Adjustable duration · Auto-logs to progress
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-dimmer group-hover:text-coral transition-colors" />
        </Link>
      </div>
    </div>
  );
}
