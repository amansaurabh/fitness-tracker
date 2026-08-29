import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ streakDays: 0 });
    }

    // Fetch distinct active dates from sessions, cardio, food logs, and weight logs
    const [sessions, cardio, foods, weights] = await Promise.all([
      db.workoutSession.findMany({
        where: { userId: user.id },
        select: { startedAt: true },
      }),
      db.cardioLog.findMany({
        where: { userId: user.id },
        select: { loggedAt: true },
      }),
      db.foodLog.findMany({
        where: { userId: user.id },
        select: { loggedAt: true },
      }),
      db.bodyWeightLog.findMany({
        where: { userId: user.id },
        select: { loggedAt: true },
      }),
    ]);

    const activeDates = new Set<string>();

    const addDate = (d: Date) => {
      const dateStr = d.toISOString().split("T")[0];
      activeDates.add(dateStr);
    };

    sessions.forEach((s) => addDate(s.startedAt));
    cardio.forEach((c) => addDate(c.loggedAt));
    foods.forEach((f) => addDate(f.loggedAt));
    weights.forEach((w) => addDate(w.loggedAt));

    if (activeDates.size === 0) {
      return NextResponse.json({ streakDays: 1, hasActivityToday: false });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Check if active today or yesterday to continue streak
    let currentCheckDate = new Date();
    if (!activeDates.has(todayStr)) {
      if (!activeDates.has(yesterdayStr)) {
        // Streak broken or just starting
        return NextResponse.json({ streakDays: 1, hasActivityToday: false });
      }
      currentCheckDate = yesterday;
    }

    let streak = 0;
    while (true) {
      const dateStr = currentCheckDate.toISOString().split("T")[0];
      if (activeDates.has(dateStr)) {
        streak += 1;
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({
      streakDays: Math.max(1, streak),
      hasActivityToday: activeDates.has(todayStr),
    });
  } catch (error) {
    console.error("GET /api/user/streak error:", error);
    return NextResponse.json({ streakDays: 1 });
  }
}

