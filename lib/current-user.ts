import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) return user;
    }
  } catch (e) {
    // Continue to fallback
  }

  // Single-user / local demo default user
  let defaultUser = await db.user.findFirst({
    where: { email: "demo@fittrack.app" },
  });

  if (!defaultUser) {
    try {
      defaultUser = await db.user.create({
        data: {
          email: "demo@fittrack.app",
          name: "Athlete",
        },
      });

      // Seed default workout schedules for the primary user
      const pushSchedule = await db.workoutSchedule.create({
        data: {
          userId: defaultUser.id,
          name: "Push (Chest, Shoulders, Triceps)",
          sortOrder: 1,
          exercises: {
            create: [
              { exerciseName: "Incline DB Press", targetSets: 4, targetReps: "8-12", notes: "Warm up with 15kg", sortOrder: 1 },
              { exerciseName: "Barbell Bench Press", targetSets: 3, targetReps: "6-8", notes: "Heavy compound", sortOrder: 2 },
              { exerciseName: "Dumbbell Shoulder Press", targetSets: 3, targetReps: "10-12", sortOrder: 3 },
              { exerciseName: "Lateral Raises", targetSets: 4, targetReps: "12-15", sortOrder: 4 },
              { exerciseName: "Pec Dec Fly", targetSets: 3, targetReps: "12-15", sortOrder: 5 },
              { exerciseName: "Tricep Rope Pushdown", targetSets: 3, targetReps: "12-15", sortOrder: 6 },
            ],
          },
        },
      });

      const pullSchedule = await db.workoutSchedule.create({
        data: {
          userId: defaultUser.id,
          name: "Pull (Back & Biceps)",
          sortOrder: 2,
          exercises: {
            create: [
              { exerciseName: "Lat Pulldown", targetSets: 4, targetReps: "8-12", sortOrder: 1 },
              { exerciseName: "Seated Cable Row", targetSets: 4, targetReps: "10-12", sortOrder: 2 },
              { exerciseName: "Barbell Bicep Curl", targetSets: 3, targetReps: "10-12", sortOrder: 3 },
              { exerciseName: "Hammer Curls", targetSets: 3, targetReps: "12-15", sortOrder: 4 },
              { exerciseName: "Face Pulls", targetSets: 3, targetReps: "15-20", sortOrder: 5 },
            ],
          },
        },
      });

      const legsSchedule = await db.workoutSchedule.create({
        data: {
          userId: defaultUser.id,
          name: "Legs & Core",
          sortOrder: 3,
          exercises: {
            create: [
              { exerciseName: "Barbell Squats", targetSets: 4, targetReps: "6-10", sortOrder: 1 },
              { exerciseName: "Romanian Deadlift", targetSets: 4, targetReps: "8-10", sortOrder: 2 },
              { exerciseName: "Leg Press", targetSets: 3, targetReps: "10-12", sortOrder: 3 },
              { exerciseName: "Calf Raises", targetSets: 4, targetReps: "15-20", sortOrder: 4 },
              { exerciseName: "Hanging Leg Raises", targetSets: 3, targetReps: "15", sortOrder: 5 },
            ],
          },
        },
      });

      // Seed default diet plan
      await db.dietPlan.create({
        data: {
          userId: defaultUser.id,
          dailyCalories: 2400,
          dailyProteinG: 160,
          dailyCarbsG: 240,
          dailyFatG: 65,
          dailyFiberG: 35,
          activeFrom: new Date(),
        },
      });

      // Seed initial custom food sample (e.g. Indian home cooked dish from spec)
      await db.customFood.create({
        data: {
          userId: defaultUser.id,
          name: "Roti with besan + soya flour",
          caloriesPer100g: 285,
          proteinPer100g: 15,
          carbsPer100g: 45,
          fatPer100g: 4.5,
          fiberPer100g: 8,
        },
      });
    } catch (err) {
      console.error("Error creating default user and seed data:", err);
    }
  }

  return defaultUser;
}

