import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { searchUsdaFoods, FoodNutrientsPer100g } from "@/lib/usda";
import { searchFatSecretFoods } from "@/lib/fatsecret";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url, "http://localhost");
    const query = (url.searchParams.get("q") || "").trim();

    if (!query) {
      return NextResponse.json([]);
    }

    // 1. Search user's custom_foods first
    const customFoods = await db.customFood.findMany({
      where: {
        userId: user.id,
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
    });

    const customResults: FoodNutrientsPer100g[] = customFoods.map((cf) => ({
      id: cf.id,
      name: cf.name,
      caloriesPer100g: Number(cf.caloriesPer100g),
      proteinPer100g: Number(cf.proteinPer100g),
      carbsPer100g: Number(cf.carbsPer100g),
      fatPer100g: Number(cf.fatPer100g),
      fiberPer100g: Number(cf.fiberPer100g),
      source: "custom",
    }));

    // 2. Query USDA FoodData Central (Foundation & SR Legacy) as Primary
    let externalResults = await searchUsdaFoods(query);

    // If USDA returns few/no results and FatSecret is configured, query FatSecret
    if (externalResults.length < 3 && process.env.FATSECRET_CLIENT_ID && process.env.FATSECRET_CLIENT_SECRET) {
      const fatSecretResults = await searchFatSecretFoods(query);
      const existingNames = new Set(externalResults.map((e) => e.name.toLowerCase()));
      for (const fsItem of fatSecretResults) {
        if (!existingNames.has(fsItem.name.toLowerCase())) {
          externalResults.push(fsItem);
        }
      }
    }

    // Combine results: custom foods first, followed by external results (deduplicating by name if identical)
    const seen = new Set(customResults.map((r) => r.name.toLowerCase()));
    const filteredExternal = externalResults.filter(
      (r) => !seen.has(r.name.toLowerCase())
    );

    return NextResponse.json([...customResults, ...filteredExternal]);
  } catch (error) {
    console.error("GET /api/foods/search error:", error);
    return NextResponse.json({ error: "Failed to search foods" }, { status: 500 });
  }
}
