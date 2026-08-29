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

    const measurements = await db.bodyMeasurement.findMany({
      where: { userId: user.id },
      orderBy: { loggedAt: "asc" },
      take: 52,
    });

    const formatted = measurements.map((m) => ({
      id: m.id,
      chestCm: m.chestCm ? Number(m.chestCm) : null,
      waistCm: m.waistCm ? Number(m.waistCm) : null,
      armCm: m.armCm ? Number(m.armCm) : null,
      thighCm: m.thighCm ? Number(m.thighCm) : null,
      loggedAt: m.loggedAt.toISOString().split("T")[0],
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET /api/body/measurements error:", error);
    return NextResponse.json({ error: "Failed to fetch body measurements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { chestCm, waistCm, armCm, thighCm, loggedAt } = body;

    const today = loggedAt ? new Date(loggedAt) : new Date();
    const dateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    const measurement = await db.bodyMeasurement.create({
      data: {
        userId: user.id,
        chestCm: chestCm !== undefined && chestCm !== null ? new Prisma.Decimal(Number(chestCm)) : null,
        waistCm: waistCm !== undefined && waistCm !== null ? new Prisma.Decimal(Number(waistCm)) : null,
        armCm: armCm !== undefined && armCm !== null ? new Prisma.Decimal(Number(armCm)) : null,
        thighCm: thighCm !== undefined && thighCm !== null ? new Prisma.Decimal(Number(thighCm)) : null,
        loggedAt: dateOnly,
      },
    });

    return NextResponse.json(measurement, { status: 201 });
  } catch (error) {
    console.error("POST /api/body/measurements error:", error);
    return NextResponse.json({ error: "Failed to log body measurements" }, { status: 500 });
  }
}
