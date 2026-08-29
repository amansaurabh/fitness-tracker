import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      heightCm,
      currentWeightKg,
      targetWeightKg,
      gymDaysPerWeek,
      workoutMinutes,
      cardioMinutes,
      primaryGoal,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const weightNum = currentWeightKg ? parseFloat(currentWeightKg) : 70;
    const heightNum = heightCm ? parseFloat(heightCm) : 175;
    const gymDaysNum = gymDaysPerWeek ? parseInt(gymDaysPerWeek, 10) : 4;
    const workoutMinsNum = workoutMinutes ? parseInt(workoutMinutes, 10) : 60;
    const cardioMinsNum = cardioMinutes ? parseInt(cardioMinutes, 10) : 15;
    const goalStr = primaryGoal || "gain"; // "gain" | "loss" | "maintain" | "recomp"

    // 1. Create User
    const user = await db.user.create({
      data: {
        name: (name || email.split("@")[0]).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        heightCm: heightCm ? new Prisma.Decimal(heightNum) : null,
        targetWeightKg: targetWeightKg ? new Prisma.Decimal(parseFloat(targetWeightKg)) : null,
        gymDaysPerWeek: gymDaysNum,
        workoutMinutes: workoutMinsNum,
        cardioMinutes: cardioMinsNum,
        primaryGoal: goalStr,
      },
    });

    // 2. Log initial body weight for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      await db.bodyWeightLog.create({
        data: {
          userId: user.id,
          weightKg: new Prisma.Decimal(weightNum),
          loggedAt: today,
        },
      });
    } catch (e) {
      // Weight log uniqueness handled
    }

    // 3. Compute personalized Nutrition Plan
    // BMR (Mifflin-St Jeor formula estimate)
    const bmr = 10 * weightNum + 6.25 * heightNum - 5 * 25 + 5;
    let activityFactor = 1.35;
    if (gymDaysNum >= 5) activityFactor = 1.55;
    else if (gymDaysNum >= 4) activityFactor = 1.45;

    let tdee = Math.round(bmr * activityFactor);
    let targetCalories = tdee;
    if (goalStr === "gain") targetCalories = tdee + 300;
    else if (goalStr === "loss") targetCalories = Math.max(1500, tdee - 400);

    // Protein: 2.0g per kg of bodyweight
    const targetProtein = Math.round(weightNum * 2.0);
    // Fat: 25% of total calories (9 kcal/g)
    const targetFat = Math.round((targetCalories * 0.25) / 9);
    // Carbs: Remainder / 4
    const remainingCals = Math.max(0, targetCalories - (targetProtein * 4 + targetFat * 9));
    const targetCarbs = Math.round(remainingCals / 4);

    await db.dietPlan.create({
      data: {
        userId: user.id,
        dailyCalories: targetCalories,
        dailyProteinG: targetProtein,
        dailyCarbsG: targetCarbs,
        dailyFatG: targetFat,
        dailyFiberG: 35,
        activeFrom: new Date(),
      },
    });

    // 4. Seed personalized workout schedules
    const schedulesToCreate = [
      {
        name: "Push (Chest, Shoulders & Triceps)",
        sortOrder: 1,
        exercises: [
          { exerciseName: "Incline DB Press", targetSets: 4, targetReps: "8-12", notes: "Warm up with 15kg", sortOrder: 1 },
          { exerciseName: "Barbell Bench Press", targetSets: 3, targetReps: "6-8", notes: "Heavy compound", sortOrder: 2 },
          { exerciseName: "Dumbbell Shoulder Press", targetSets: 3, targetReps: "10-12", sortOrder: 3 },
          { exerciseName: "Lateral Raises", targetSets: 4, targetReps: "12-15", sortOrder: 4 },
          { exerciseName: "Pec Dec Fly", targetSets: 3, targetReps: "12-15", sortOrder: 5 },
          { exerciseName: "Tricep Rope Pushdown", targetSets: 3, targetReps: "12-15", sortOrder: 6 },
        ],
      },
      {
        name: "Pull (Back & Biceps)",
        sortOrder: 2,
        exercises: [
          { exerciseName: "Lat Pulldown", targetSets: 4, targetReps: "8-12", sortOrder: 1 },
          { exerciseName: "Seated Cable Row", targetSets: 4, targetReps: "10-12", sortOrder: 2 },
          { exerciseName: "Barbell Bicep Curl", targetSets: 3, targetReps: "10-12", sortOrder: 3 },
          { exerciseName: "Hammer Curls", targetSets: 3, targetReps: "12-15", sortOrder: 4 },
          { exerciseName: "Face Pulls", targetSets: 3, targetReps: "15-20", sortOrder: 5 },
        ],
      },
      {
        name: "Legs & Core",
        sortOrder: 3,
        exercises: [
          { exerciseName: "Barbell Squats", targetSets: 4, targetReps: "6-10", sortOrder: 1 },
          { exerciseName: "Romanian Deadlift", targetSets: 4, targetReps: "8-10", sortOrder: 2 },
          { exerciseName: "Leg Press", targetSets: 3, targetReps: "10-12", sortOrder: 3 },
          { exerciseName: "Calf Raises", targetSets: 4, targetReps: "15-20", sortOrder: 4 },
          { exerciseName: "Hanging Leg Raises", targetSets: 3, targetReps: "15", sortOrder: 5 },
        ],
      },
    ];

    for (const s of schedulesToCreate) {
      await db.workoutSchedule.create({
        data: {
          userId: user.id,
          name: s.name,
          sortOrder: s.sortOrder,
          exercises: {
            create: s.exercises,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        heightCm: user.heightCm,
        currentWeightKg: weightNum,
        targetWeightKg: user.targetWeightKg,
        gymDaysPerWeek: user.gymDaysPerWeek,
        workoutMinutes: user.workoutMinutes,
        cardioMinutes: user.cardioMinutes,
        primaryGoal: user.primaryGoal,
      },
    });
  } catch (error) {
    console.error("POST /api/auth/register error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

