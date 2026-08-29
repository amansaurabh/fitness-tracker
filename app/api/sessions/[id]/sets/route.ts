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

    // Business Logic: 1. PR Check
    // Query MAX(weightKg) for this user + exercise across ALL prior sessions
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
      },
    });

    let isPr = false;
    if (priorSets.length > 0) {
      const maxPriorWeight = Math.max(...priorSets.map((s) => Number(s.weightKg)));
      if (Number(weightKg) > maxPriorWeight) {
        isPr = true;
      }
    } else {
      // First time lifting this exercise with positive weight
      if (Number(weightKg) > 0) {
        isPr = true;
      }
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
