import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url, "http://localhost");
    const dateParam = searchParams.get("date");

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [logs, plan] = await Promise.all([
      db.foodLog.findMany({
        where: {
          userId: user.id,
          loggedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: { loggedAt: "desc" },
      }),
      db.dietPlan.findFirst({
        where: { userId: user.id },
        orderBy: { activeFrom: "desc" },
      }),
    ]);

    const activePlan = plan || {
      dailyCalories: 2400,
      dailyProteinG: 160,
      dailyCarbsG: 240,
      dailyFatG: 65,
      dailyFiberG: 35,
    };

    // Calculate totals from snapshot
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    for (const item of logs) {
      totalCalories += Number(item.calories);
      totalProtein += Number(item.proteinG);
      totalCarbs += Number(item.carbsG);
      totalFat += Number(item.fatG);
      totalFiber += Number(item.fiberG);
    }

    // Calculate adherence score (percentage match across macros, 90-110% ideal)
    const calRatio = activePlan.dailyCalories > 0 ? totalCalories / activePlan.dailyCalories : 0;
    const proteinRatio = activePlan.dailyProteinG > 0 ? totalProtein / activePlan.dailyProteinG : 0;

    let adherenceScore = 0;
    if (calRatio >= 0.9 && calRatio <= 1.1 && proteinRatio >= 0.9) {
      adherenceScore = 100;
    } else {
      const avgRatio = (Math.min(calRatio, 1) + Math.min(proteinRatio, 1)) / 2;
      adherenceScore = Math.round(avgRatio * 100);
    }

    return NextResponse.json({
      logs,
      plan: activePlan,
      totals: {
        calories: Math.round(totalCalories),
        proteinG: Math.round(totalProtein * 10) / 10,
        carbsG: Math.round(totalCarbs * 10) / 10,
        fatG: Math.round(totalFat * 10) / 10,
        fiberG: Math.round(totalFiber * 10) / 10,
      },
      remaining: {
        calories: Math.max(0, Math.round(activePlan.dailyCalories - totalCalories)),
        proteinG: Math.max(0, Math.round((activePlan.dailyProteinG - totalProtein) * 10) / 10),
        carbsG: Math.max(0, Math.round((activePlan.dailyCarbsG - totalCarbs) * 10) / 10),
        fatG: Math.max(0, Math.round((activePlan.dailyFatG - totalFat) * 10) / 10),
        fiberG: Math.max(0, Math.round((activePlan.dailyFiberG - totalFiber) * 10) / 10),
      },
      adherenceScore,
    });
  } catch (error) {
    console.error("GET /api/diet/log error:", error);
    return NextResponse.json({ error: "Failed to fetch food logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { foodName, quantityG, calories, proteinG, carbsG, fatG, fiberG, source } = body;

    if (!foodName || quantityG === undefined) {
      return NextResponse.json({ error: "foodName and quantityG are required" }, { status: 400 });
    }

    // Macro Snapshotting Invariant: Snapshot values at log time
    const log = await db.foodLog.create({
      data: {
        userId: user.id,
        foodName: foodName.trim(),
        quantityG: new Prisma.Decimal(Number(quantityG)),
        calories: new Prisma.Decimal(Number(calories) || 0),
        proteinG: new Prisma.Decimal(Number(proteinG) || 0),
        carbsG: new Prisma.Decimal(Number(carbsG) || 0),
        fatG: new Prisma.Decimal(Number(fatG) || 0),
        fiberG: new Prisma.Decimal(Number(fiberG) || 0),
        source: source || "custom",
        loggedAt: new Date(),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("POST /api/diet/log error:", error);
    return NextResponse.json({ error: "Failed to log food" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url, "http://localhost");
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await db.foodLog.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/diet/log error:", error);
    return NextResponse.json({ error: "Failed to delete food log" }, { status: 500 });
  }
}
