import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weights = await db.bodyWeightLog.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: "asc" },
      take: 60,
    });

    const formatted = weights.map((w) => ({
      id: w.id,
      weightKg: Number(w.weightKg),
      loggedAt: w.loggedAt.toISOString().split("T")[0],
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/body/weight error:", error);
    return NextResponse.json({ error: "Failed to fetch weight logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { weightKg, loggedAt } = body;

    if (weightKg === undefined) {
      return NextResponse.json({ error: "weightKg is required" }, { status: 400 });
    }

    const today = loggedAt ? new Date(loggedAt) : new Date();
    // Normalize to date-only UTC midnight for @db.Date column
    const dateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    // One weight entry per day enforced by database unique constraint (userId, loggedAt)
    const weightLog = await db.bodyWeightLog.upsert({
      where: {
        userId_loggedAt: {
          userId: user.id,
          loggedAt: dateOnly,
        },
      },
      update: {
        weightKg: new Prisma.Decimal(Number(weightKg)),
      },
      create: {
        userId: user.id,
        weightKg: new Prisma.Decimal(Number(weightKg)),
        loggedAt: dateOnly,
      },
    });

    return NextResponse.json(weightLog, { status: 201 });
  } catch (error) {
    console.error("POST /api/body/weight error:", error);
    return NextResponse.json({ error: "Failed to log body weight" }, { status: 500 });
  }
}
