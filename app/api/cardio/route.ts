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

    const cardioLogs = await db.cardioLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: "desc" },
      take: 20,
    });

    return NextResponse.json(cardioLogs);
  } catch (error) {
    console.error("GET /api/cardio error:", error);
    return NextResponse.json({ error: "Failed to fetch cardio logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const durationMinutes = Number(body.durationMinutes) || 15;
    const caloriesBurned = body.caloriesBurned ? Number(body.caloriesBurned) : null;
    const inclinePct = body.inclinePct !== undefined ? Number(body.inclinePct) : null;
    const speedKmh = body.speedKmh !== undefined ? Number(body.speedKmh) : null;

    const log = await db.cardioLog.create({
      data: {
        userId: user.id,
        durationMinutes,
        caloriesBurned,
        inclinePct,
        speedKmh,
        loggedAt: new Date(),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("POST /api/cardio error:", error);
    return NextResponse.json({ error: "Failed to log cardio" }, { status: 500 });
  }
}
