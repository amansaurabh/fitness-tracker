import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Prisma } from "@prisma/client";

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

    const session = await db.workoutSession.findUnique({
      where: { id: params.id },
      include: {
        sets: {
          orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }],
        },
      },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session.sets);
  } catch (error) {
    console.error("GET /api/sessions/[id]/sets error:", error);
    return NextResponse.json({ error: "Failed to fetch sets" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await db.workoutSession.findUnique({
      where: { id: params.id },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await req.json();
    const { exerciseName, setNumber, weightKg, reps, note } = body;

    if (!exerciseName || setNumber === undefined || weightKg === undefined || reps === undefined) {
      return NextResponse.json({ error: "Missing required set fields" }, { status: 400 });
    }

    const numericWeight = new Prisma.Decimal(Number(weightKg));
    const numericReps = Number(reps);
    const setNum = Number(setNumber);
    const inputWeight = Number(weightKg);

    // Business Logic: 1. Exercise-Wise PR Check
    // Query all prior sets for this exercise across ALL previous sessions
    const priorSets = await db.setLog.findMany({
      where: {
        session: {
          userId: user.id,
          id: { not: session.id },
        },
        exerciseName: {
          equals: exerciseName.trim(),
          mode: "insensitive",
        },
      },
      select: {
        weightKg: true,
        reps: true,
      },
    });

    let maxPriorWeight = 0;
    let maxPriorRepsAtMaxWeight = 0;
    for (const s of priorSets) {
      const w = Number(s.weightKg);
      if (w > maxPriorWeight) {
        maxPriorWeight = w;
        maxPriorRepsAtMaxWeight = s.reps;
      } else if (w === maxPriorWeight && s.reps > maxPriorRepsAtMaxWeight) {
        maxPriorRepsAtMaxWeight = s.reps;
      }
    }

    // Query other sets logged in CURRENT session for this exercise
    const currentSessionSets = await db.setLog.findMany({
      where: {
        sessionId: session.id,
        exerciseName: {
          equals: exerciseName.trim(),
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        weightKg: true,
        reps: true,
      },
    });

    let maxCurrentWeight = maxPriorWeight;
    let maxCurrentRepsAtMaxWeight = maxPriorRepsAtMaxWeight;
    for (const s of currentSessionSets) {
      const w = Number(s.weightKg);
      if (w > maxCurrentWeight) {
        maxCurrentWeight = w;
        maxCurrentRepsAtMaxWeight = s.reps;
      } else if (w === maxCurrentWeight && s.reps > maxCurrentRepsAtMaxWeight) {
        maxCurrentRepsAtMaxWeight = s.reps;
      }
    }

    // A set is a PR if it strictly beats all prior history AND is the highest in the current session
    const beatsHistory =
      priorSets.length === 0
        ? inputWeight > 0
        : inputWeight > maxPriorWeight ||
          (inputWeight === maxPriorWeight && numericReps > maxPriorRepsAtMaxWeight);

    const isNewSessionPeak =
      currentSessionSets.length === 0
        ? beatsHistory
        : inputWeight > maxCurrentWeight ||
          (inputWeight === maxCurrentWeight && numericReps > maxCurrentRepsAtMaxWeight);

    const isPr = beatsHistory && isNewSessionPeak;

    if (isPr) {
      // Clear PR flag on any previous sets in this current session for this exercise so only highest retains PR
      await db.setLog.updateMany({
        where: {
          sessionId: session.id,
          exerciseName: {
            equals: exerciseName.trim(),
            mode: "insensitive",
          },
        },
        data: { isPr: false },
      });
    }

    // Create the set log entry
    const newSet = await db.setLog.create({
      data: {
        sessionId: session.id,
        exerciseName: exerciseName.trim(),
        setNumber: setNum,
        weightKg: numericWeight,
        reps: numericReps,
        note: note ? String(note).trim() : null,
        isPr,
        loggedAt: new Date(),
      },
    });

    // Business Logic: 2. Last-Time Reference
    // Query the most recent session (other than this one) that contained this exercise
    const previousSessionWithExercise = await db.workoutSession.findFirst({
      where: {
        userId: user.id,
        id: { not: session.id },
        sets: {
          some: {
            exerciseName: {
              equals: exerciseName.trim(),
              mode: "insensitive",
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
      include: {
        sets: {
          where: {
            exerciseName: {
              equals: exerciseName.trim(),
              mode: "insensitive",
            },
          },
          orderBy: { setNumber: "asc" },
        },
      },
    });

    const lastTimeReference = previousSessionWithExercise
      ? {
          sessionId: previousSessionWithExercise.id,
          date: previousSessionWithExercise.startedAt,
          sets: previousSessionWithExercise.sets.map((s) => ({
            setNumber: s.setNumber,
            weightKg: Number(s.weightKg),
            reps: s.reps,
          })),
        }
      : null;

    return NextResponse.json(
      {
        set: newSet,
        isPr,
        lastTimeReference,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sessions/[id]/sets error:", error);
    return NextResponse.json({ error: "Failed to log set" }, { status: 500 });
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

    const session = await db.workoutSession.findUnique({
      where: { id: params.id },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const setId = searchParams.get("setId");
    const exerciseName = searchParams.get("exerciseName");

    if (setId) {
      await db.setLog.deleteMany({
        where: {
          id: setId,
          sessionId: session.id,
        },
      });
      return NextResponse.json({ success: true, message: "Set deleted" });
    }

    if (exerciseName) {
      await db.setLog.deleteMany({
        where: {
          sessionId: session.id,
          exerciseName: {
            equals: exerciseName.trim(),
            mode: "insensitive",
          },
        },
      });
      return NextResponse.json({ success: true, message: "Exercise sets deleted" });
    }

    return NextResponse.json(
      { error: "setId or exerciseName required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("DELETE /api/sessions/[id]/sets error:", error);
    return NextResponse.json(
      { error: "Failed to delete set" },
      { status: 500 }
    );
  }
}
