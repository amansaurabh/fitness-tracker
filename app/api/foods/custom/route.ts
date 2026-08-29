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

    const foods = await db.customFood.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(foods);
  } catch (error) {
    console.error("GET /api/foods/custom error:", error);
    return NextResponse.json({ error: "Failed to fetch custom foods" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, fiberPer100g } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Food name is required" }, { status: 400 });
    }

    const customFood = await db.customFood.create({
      data: {
        userId: user.id,
        name: name.trim(),
        caloriesPer100g: new Prisma.Decimal(Number(caloriesPer100g) || 0),
        proteinPer100g: new Prisma.Decimal(Number(proteinPer100g) || 0),
        carbsPer100g: new Prisma.Decimal(Number(carbsPer100g) || 0),
        fatPer100g: new Prisma.Decimal(Number(fatPer100g) || 0),
        fiberPer100g: new Prisma.Decimal(Number(fiberPer100g) || 0),
      },
    });

    return NextResponse.json(customFood, { status: 201 });
  } catch (error) {
    console.error("POST /api/foods/custom error:", error);
    return NextResponse.json({ error: "Failed to create custom food" }, { status: 500 });
  }
}
