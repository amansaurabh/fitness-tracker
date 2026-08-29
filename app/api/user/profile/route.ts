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

    // Get latest weight
    const latestWeight = await db.bodyWeightLog.findFirst({
      where: { userId: user.id },
      orderBy: { loggedAt: "desc" },
    });

    return NextResponse.json({
      id: user.id,
      name: user.name || user.email.split("@")[0],
      email: user.email,
      heightCm: user.heightCm ? Number(user.heightCm) : null,
      currentWeightKg: latestWeight ? Number(latestWeight.weightKg) : null,
      targetWeightKg: user.targetWeightKg ? Number(user.targetWeightKg) : null,
      gymDaysPerWeek: user.gymDaysPerWeek || 4,
      workoutMinutes: user.workoutMinutes || 60,
      cardioMinutes: user.cardioMinutes || 15,
      primaryGoal: user.primaryGoal || "gain",
    });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      heightCm,
      targetWeightKg,
      gymDaysPerWeek,
      workoutMinutes,
      cardioMinutes,
      primaryGoal,
    } = body;

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: name ? name.trim() : user.name,
        heightCm: heightCm ? new Prisma.Decimal(parseFloat(heightCm)) : user.heightCm,
        targetWeightKg: targetWeightKg ? new Prisma.Decimal(parseFloat(targetWeightKg)) : user.targetWeightKg,
        gymDaysPerWeek: gymDaysPerWeek ? parseInt(gymDaysPerWeek, 10) : user.gymDaysPerWeek,
        workoutMinutes: workoutMinutes ? parseInt(workoutMinutes, 10) : user.workoutMinutes,
        cardioMinutes: cardioMinutes ? parseInt(cardioMinutes, 10) : user.cardioMinutes,
        primaryGoal: primaryGoal || user.primaryGoal,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
    });
  } catch (error) {
    console.error("PATCH /api/user/profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

