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

    let plan = await db.dietPlan.findFirst({
      where: { userId: user.id },
      orderBy: { activeFrom: "desc" },
    });

    if (!plan) {
      plan = await db.dietPlan.create({
        data: {
          userId: user.id,
          dailyCalories: 2400,
          dailyProteinG: 160,
          dailyCarbsG: 240,
          dailyFatG: 65,
          dailyFiberG: 35,
          activeFrom: new Date(),
        },
      });
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("GET /api/diet/plan error:", error);
    return NextResponse.json({ error: "Failed to fetch diet plan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { dailyCalories, dailyProteinG, dailyCarbsG, dailyFatG, dailyFiberG } = body;

    const plan = await db.dietPlan.create({
      data: {
        userId: user.id,
        dailyCalories: Number(dailyCalories) || 2400,
        dailyProteinG: Number(dailyProteinG) || 160,
        dailyCarbsG: Number(dailyCarbsG) || 240,
        dailyFatG: Number(dailyFatG) || 65,
        dailyFiberG: Number(dailyFiberG) || 35,
        activeFrom: new Date(),
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error("POST /api/diet/plan error:", error);
    return NextResponse.json({ error: "Failed to update diet plan" }, { status: 500 });
  }
}
