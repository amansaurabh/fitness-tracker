import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url, "http://localhost");
    const days = parseInt(searchParams.get("days") || "7", 10);

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const [logs, plan] = await Promise.all([
      db.foodLog.findMany({
        where: {
          userId: user.id,
          loggedAt: {
            gte: startDate,
          },
        },
        orderBy: { loggedAt: "asc" },
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

    // Group logs by day
    const dailyMap: {
      [dateStr: string]: {
        dateStr: string;
        dayName: string;
        formattedDate: string;
        calories: number;
        proteinG: number;
        carbsG: number;
        fatG: number;
        fiberG: number;
        adherenceScore: number;
      };
    } = {};

    // Initialize all past `days` dates
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split("T")[0];
      dailyMap[key] = {
        dateStr: key,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        formattedDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        calories: 0,
        proteinG: 0,
        carbsG: 0,
        fatG: 0,
        fiberG: 0,
        adherenceScore: 0,
      };
    }

    // Aggregate logs
    logs.forEach((log) => {
      const key = log.loggedAt.toISOString().split("T")[0];
      if (dailyMap[key]) {
        dailyMap[key].calories += Number(log.calories);
        dailyMap[key].proteinG += Number(log.proteinG);
        dailyMap[key].carbsG += Number(log.carbsG);
        dailyMap[key].fatG += Number(log.fatG);
        dailyMap[key].fiberG += Number(log.fiberG);
      }
    });

    // Compute adherence score per day
    const history = Object.values(dailyMap).map((day) => {
      const calRatio = activePlan.dailyCalories > 0 ? day.calories / activePlan.dailyCalories : 0;
      const proteinRatio = activePlan.dailyProteinG > 0 ? day.proteinG / activePlan.dailyProteinG : 0;

      let score = 0;
      if (calRatio >= 0.9 && calRatio <= 1.1 && proteinRatio >= 0.9) {
        score = 100;
      } else {
        const avg = (Math.min(calRatio, 1) + Math.min(proteinRatio, 1)) / 2;
        score = Math.round(avg * 100);
      }

      return {
        ...day,
        calories: Math.round(day.calories),
        proteinG: Math.round(day.proteinG * 10) / 10,
        carbsG: Math.round(day.carbsG * 10) / 10,
        fatG: Math.round(day.fatG * 10) / 10,
        fiberG: Math.round(day.fiberG * 10) / 10,
        adherenceScore: score,
      };
    });

    const nonZeroDays = history.filter((d) => d.calories > 0);
    const avgCalories = nonZeroDays.length > 0
      ? Math.round(nonZeroDays.reduce((acc, d) => acc + d.calories, 0) / nonZeroDays.length)
      : 0;

    const avgAdherence = nonZeroDays.length > 0
      ? Math.round(nonZeroDays.reduce((acc, d) => acc + d.adherenceScore, 0) / nonZeroDays.length)
      : 0;

    return NextResponse.json({
      history,
      plan: activePlan,
      weeklyAverage: {
        calories: avgCalories,
        adherence: avgAdherence,
        loggedDays: nonZeroDays.length,
      },
    });
  } catch (error) {
    console.error("GET /api/diet/history error:", error);
    return NextResponse.json({ error: "Failed to fetch diet history" }, { status: 500 });
  }
}

