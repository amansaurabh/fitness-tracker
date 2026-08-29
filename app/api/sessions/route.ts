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

    const sessions = await db.workoutSession.findMany({
      where: { userId: user.id },
      include: {
        schedule: true,
        sets: {
          orderBy: { loggedAt: "asc" },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("GET /api/sessions error:", error);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { scheduleId } = body;

    if (!scheduleId) {
      return NextResponse.json({ error: "scheduleId is required" }, { status: 400 });
    }

    const schedule = await db.workoutSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        exercises: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const session = await db.workoutSession.create({
      data: {
        userId: user.id,
        scheduleId: schedule.id,
        startedAt: new Date(),
      },
      include: {
        schedule: {
          include: {
            exercises: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        sets: true,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}
