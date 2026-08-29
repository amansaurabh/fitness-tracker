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

    const session = await db.workoutSession.findUnique({
      where: { id: params.id },
      include: {
        schedule: {
          include: {
            exercises: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        sets: {
          orderBy: { loggedAt: "asc" },
        },
      },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("GET /api/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
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

    const session = await db.workoutSession.findUnique({
      where: { id: params.id },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updated = await db.workoutSession.update({
      where: { id: params.id },
      data: {
        endedAt: new Date(),
      },
      include: {
        schedule: true,
        sets: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/sessions/[id] error:", error);
    return NextResponse.json({ error: "Failed to finish session" }, { status: 500 });
  }
}
