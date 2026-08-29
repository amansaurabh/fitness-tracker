import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedule = await db.workoutSchedule.findUnique({
      where: { id: params.id },
      include: {
        exercises: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!schedule || schedule.userId !== user.id) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Fetch past sessions for this schedule
    const sessions = await db.workoutSession.findMany({
      where: {
        userId: user.id,
        scheduleId: schedule.id,
      },
      include: {
        sets: {
          orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }],
        },
      },
      orderBy: { startedAt: "desc" },
      take: 15,
    });

    const history = sessions.map((s) => {
      let totalVolume = 0;
      let prCount = 0;
      const exerciseMap: Record<string, { setNumber: number; weightKg: number; reps: number; isPr: boolean }[]> = {};

      s.sets.forEach((set) => {
        const weight = Number(set.weightKg) || 0;
        const reps = Number(set.reps) || 0;
        totalVolume += weight * reps;
        if (set.isPr) prCount++;

        const exName = set.exerciseName;
        if (!exerciseMap[exName]) exerciseMap[exName] = [];
        exerciseMap[exName].push({
          setNumber: set.setNumber,
          weightKg: weight,
          reps: reps,
          isPr: !!set.isPr,
        });
      });

      // Duration calculation
      let durationMinutes = 0;
      if (s.endedAt && s.startedAt) {
        durationMinutes = Math.round(
          (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000
        );
      } else if (s.sets.length > 0) {
        durationMinutes = Math.max(15, s.sets.length * 3);
      }

      return {
        sessionId: s.id,
        date: s.startedAt,
        durationMinutes,
        totalVolumeKg: Math.round(totalVolume),
        setsCount: s.sets.length,
        prCount,
        exercises: Object.entries(exerciseMap).map(([name, sets]) => ({
          exerciseName: name,
          sets,
        })),
      };
    });

    return NextResponse.json({
      scheduleName: schedule.name,
      history,
    });
  } catch (error) {
    console.error("GET /api/workouts/[id]/history error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout history" },
      { status: 500 }
    );
  }
}
