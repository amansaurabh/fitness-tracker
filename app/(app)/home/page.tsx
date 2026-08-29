"use client";

import React, { useEffect, useState } from "react";
import { GreetingHeader } from "@/components/home/greeting-header";
import { MacroRing } from "@/components/home/macro-ring";
import { TodayWorkoutCard } from "@/components/home/today-workout-card";
import { MiniStatCards } from "@/components/home/mini-stat-cards";

export default function HomePage() {
  const [data, setData] = useState<{
    userName: string;
    userProfile: any;
    streakDays: number;
    calories: { current: number; target: number };
    protein: { current: number; target: number };
    carbs: { current: number; target: number };
    fat: { current: number; target: number };
    todaySchedule: {
      id: string;
      dayLabel: string;
      title: string;
      exercises: string[];
    } | null;
    recentDurationText: string;
    weightToday: number | null;
  }>({
    userName: "Athlete",
    userProfile: null,
    streakDays: 1,
    calories: { current: 0, target: 2400 },
    protein: { current: 0, target: 160 },
    carbs: { current: 0, target: 240 },
    fat: { current: 0, target: 65 },
    todaySchedule: {
      id: "default",
      dayLabel: "Schedule · Push",
      title: "Chest, Shoulders & Triceps",
      exercises: ["Incline DB Press", "Shoulder Press", "Pec Dec", "+3 more"],
    },
    recentDurationText: "No recent workouts",
    weightToday: null,
  });

  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [dietRes, workoutRes, weightRes, sessionRes, streakRes, profileRes] = await Promise.allSettled([
        fetch("/api/diet/log").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/workouts").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/body/weight").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/sessions").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/user/streak").then((r) => (r.ok ? r.json() : null)),
        fetch("/api/user/profile").then((r) => (r.ok ? r.json() : null)),
      ]);

      const dietData = dietRes.status === "fulfilled" ? dietRes.value : null;
      const workoutsData = workoutRes.status === "fulfilled" ? workoutRes.value : null;
      const weightsData = weightRes.status === "fulfilled" ? weightRes.value : null;
      const sessionsData = sessionRes.status === "fulfilled" ? sessionRes.value : null;
      const streakData = streakRes.status === "fulfilled" ? streakRes.value : null;
      const profileData = profileRes.status === "fulfilled" ? profileRes.value : null;

      // 1. Weight today
      let currentWeight: number | null = null;
      if (weightsData && Array.isArray(weightsData) && weightsData.length > 0) {
        const latest = weightsData[weightsData.length - 1];
        currentWeight = Number(latest.weightKg);
      }

      // 2. Recent workout duration (from actual user sessions)
      let durationText = "No recent workouts";
      if (sessionsData && Array.isArray(sessionsData) && sessionsData.length > 0) {
        const completedSessions = sessionsData.filter((s) => s.startedAt && s.endedAt);
        if (completedSessions.length > 0) {
          durationText = completedSessions
            .slice(0, 2)
            .map((s) => {
              const diff = (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000;
              return `${Math.max(1, Math.round(diff))}m`;
            })
            .join(" · ");
        }
      }

      // 3. Today's schedule
      let activeSched = null;
      if (workoutsData && Array.isArray(workoutsData) && workoutsData.length > 0) {
        const firstSched = workoutsData[0];
        const exNames = (firstSched.exercises || []).map((e: any) => e.exerciseName);
        activeSched = {
          id: firstSched.id,
          dayLabel: `Schedule · ${firstSched.name.split(" ")[0]}`,
          title: firstSched.name,
          exercises: exNames.length > 3 ? [...exNames.slice(0, 3), `+${exNames.length - 3} more`] : exNames,
        };
      }

      setData({
        userName: profileData?.name || "Athlete",
        userProfile: profileData,
        streakDays: streakData?.streakDays ?? 1,
        calories: {
          current: dietData?.totals?.calories ?? 0,
          target: dietData?.plan?.dailyCalories ?? 2400,
        },
        protein: {
          current: dietData?.totals?.proteinG ?? 0,
          target: dietData?.plan?.dailyProteinG ?? 160,
        },
        carbs: {
          current: dietData?.totals?.carbsG ?? 0,
          target: dietData?.plan?.dailyCarbsG ?? 240,
        },
        fat: {
          current: dietData?.totals?.fatG ?? 0,
          target: dietData?.plan?.dailyFatG ?? 65,
        },
        todaySchedule: activeSched,
        recentDurationText: durationText,
        weightToday: currentWeight,
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <main className="w-full flex flex-col">
      <GreetingHeader
        userName={data.userName}
        streakDays={data.streakDays}
        userProfile={data.userProfile}
        onProfileUpdated={loadDashboard}
      />

      <MacroRing
        currentCalories={data.calories.current}
        targetCalories={data.calories.target}
        protein={data.protein}
        carbs={data.carbs}
        fat={data.fat}
      />

      {data.todaySchedule && (
        <TodayWorkoutCard
          scheduleId={data.todaySchedule.id}
          dayLabel={data.todaySchedule.dayLabel}
          title={data.todaySchedule.title}
          exercises={data.todaySchedule.exercises}
        />
      )}

      <MiniStatCards
        recentDurationText={data.recentDurationText}
        weightToday={data.weightToday}
        onWeightUpdated={loadDashboard}
      />
    </main>
  );
}
