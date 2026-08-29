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

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("GET /api/workouts/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, exercises } = body;

    const existing = await db.workoutSchedule.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    // Update schedule
    const updated = await db.workoutSchedule.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
      },
    });

    // If exercises array is provided, replace or update them
    if (exercises && Array.isArray(exercises)) {
      await db.scheduleExercise.deleteMany({
        where: { scheduleId: params.id },
      });

      await db.scheduleExercise.createMany({
        data: exercises.map((ex: any, idx: number) => ({
          scheduleId: params.id,
          exerciseName: ex.exerciseName || ex.name,
          targetSets: Number(ex.targetSets) || 3,
          targetReps: String(ex.targetReps || "8-12"),
          notes: ex.notes || null,
          sortOrder: idx + 1,
        })),
      });
    }

    const fullSchedule = await db.workoutSchedule.findUnique({
      where: { id: params.id },
      include: {
        exercises: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(fullSchedule);
  } catch (error) {
    console.error("PATCH /api/workouts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.workoutSchedule.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    await db.workoutSchedule.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/workouts/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
  }
}
