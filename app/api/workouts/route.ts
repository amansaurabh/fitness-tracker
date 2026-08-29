import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedules = await db.workoutSchedule.findMany({
      where: { userId: user.id },
      include: {
        exercises: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error("GET /api/workouts error:", error);
    return NextResponse.json({ error: "Failed to fetch workout schedules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, exercises } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Schedule name is required" }, { status: 400 });
    }

    const scheduleCount = await db.workoutSchedule.count({
      where: { userId: user.id },
    });

    const newSchedule = await db.workoutSchedule.create({
      data: {
        userId: user.id,
        name: name.trim(),
        sortOrder: scheduleCount + 1,
        exercises: {
          create: (exercises || []).map((ex: any, idx: number) => ({
            exerciseName: ex.exerciseName || ex.name,
            targetSets: Number(ex.targetSets) || 3,
            targetReps: String(ex.targetReps || "8-12"),
            notes: ex.notes || null,
            sortOrder: idx + 1,
          })),
        },
      },
      include: {
        exercises: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error) {
    console.error("POST /api/workouts error:", error);
    return NextResponse.json({ error: "Failed to create workout schedule" }, { status: 500 });
  }
}
