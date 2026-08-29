export interface FoodNutrientsPer100g {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  source: "usda" | "custom" | "standard";
  id?: string;
}

// Built-in standard reference dataset for common whole foods (offline/fallback capable)
export const STANDARD_FOOD_FALLBACKS: FoodNutrientsPer100g[] = [
  { name: "Chicken Breast (cooked, boneless)", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0, source: "standard" },
  { name: "Whole Egg (boiled, 1 large ~50g)", caloriesPer100g: 155, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 11, fiberPer100g: 0, source: "standard" },
  { name: "Egg White (cooked)", caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, fiberPer100g: 0, source: "standard" },
  { name: "White Rice (cooked)", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, fiberPer100g: 0.4, source: "standard" },
  { name: "Brown Rice (cooked)", caloriesPer100g: 111, proteinPer100g: 2.6, carbsPer100g: 23, fatPer100g: 0.9, fiberPer100g: 1.8, source: "standard" },
  { name: "Rolled Oats (raw)", caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66.3, fatPer100g: 6.9, fiberPer100g: 10.6, source: "standard" },
  { name: "Paneer (Cottage Cheese, Indian)", caloriesPer100g: 265, proteinPer100g: 18.3, carbsPer100g: 3.4, fatPer100g: 20.8, fiberPer100g: 0, source: "standard" },
  { name: "Whey Protein Powder (average scoop 30g)", caloriesPer100g: 400, proteinPer100g: 80, carbsPer100g: 6.7, fatPer100g: 5, fiberPer100g: 0, source: "standard" },
  { name: "Peanut Butter (natural)", caloriesPer100g: 588, proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, fiberPer100g: 6, source: "standard" },
  { name: "Banana (raw)", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 22.8, fatPer100g: 0.3, fiberPer100g: 2.6, source: "standard" },
  { name: "Greek Yogurt (plain, 0% fat)", caloriesPer100g: 59, proteinPer100g: 10, carbsPer100g: 3.6, fatPer100g: 0.4, fiberPer100g: 0, source: "standard" },
  { name: "Salmon (cooked, Atlantic)", caloriesPer100g: 206, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 12.3, fiberPer100g: 0, source: "standard" },
  { name: "Almonds (raw)", caloriesPer100g: 579, proteinPer100g: 21.2, carbsPer100g: 21.6, fatPer100g: 49.9, fiberPer100g: 12.5, source: "standard" },
  { name: "Lentils / Moong Dal (cooked)", caloriesPer100g: 116, proteinPer100g: 9, carbsPer100g: 20, fatPer100g: 0.4, fiberPer100g: 7.9, source: "standard" },
  { name: "Roti / Whole Wheat Chapati", caloriesPer100g: 297, proteinPer100g: 9.3, carbsPer100g: 55.4, fatPer100g: 3.7, fiberPer100g: 10.7, source: "standard" },
  { name: "Milk (Whole 3.25%)", caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3, fiberPer100g: 0, source: "standard" },
  { name: "Sweet Potato (baked)", caloriesPer100g: 90, proteinPer100g: 2, carbsPer100g: 20.7, fatPer100g: 0.15, fiberPer100g: 3.3, source: "standard" },
  { name: "Broccoli (cooked)", caloriesPer100g: 35, proteinPer100g: 2.4, carbsPer100g: 7.2, fatPer100g: 0.4, fiberPer100g: 3.3, source: "standard" },
];

export async function searchUsdaFoods(query: string): Promise<FoodNutrientsPer100g[]> {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey || apiKey === "DEMO_KEY") {
    // Return standard foods that match the query
    return STANDARD_FOOD_FALLBACKS.filter((f) =>
      f.name.toLowerCase().includes(trimmed)
    );
  }

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(
      trimmed
    )}&pageSize=10&dataType=Survey (FNDDS),Foundation,Branded`;

    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache on server for 1 hour
    });

    if (!res.ok) {
      console.warn(`USDA API responded with status ${res.status}`);
      return STANDARD_FOOD_FALLBACKS.filter((f) =>
        f.name.toLowerCase().includes(trimmed)
      );
    }

    const data = await res.json();
    if (!data.foods || !Array.isArray(data.foods)) {
      return [];
    }

    return data.foods.map((item: any) => {
      let calories = 0;
      let protein = 0;
      let fat = 0;
      let carbs = 0;
      let fiber = 0;

      for (const nutrient of item.foodNutrients || []) {
        const name = (nutrient.nutrientName || "").toLowerCase();
        const val = Number(nutrient.value) || 0;

        if (name.includes("energy") && (nutrient.unitName?.toLowerCase() === "kcal" || val < 1000)) {
          calories = val;
        } else if (name.includes("protein")) {
          protein = val;
        } else if (name.includes("total lipid") || (name.includes("fat") && !name.includes("fatty"))) {
          fat = val;
        } else if (name.includes("carbohydrate")) {
          carbs = val;
        } else if (name.includes("fiber")) {
          fiber = val;
        }
      }

      return {
        id: String(item.fdcId),
        name: item.description,
        caloriesPer100g: Math.round(calories * 10) / 10,
        proteinPer100g: Math.round(protein * 10) / 10,
        carbsPer100g: Math.round(carbs * 10) / 10,
        fatPer100g: Math.round(fat * 10) / 10,
        fiberPer100g: Math.round(fiber * 10) / 10,
        source: "usda",
      };
    });
  } catch (err) {
    console.error("USDA search error:", err);
    return STANDARD_FOOD_FALLBACKS.filter((f) =>
      f.name.toLowerCase().includes(trimmed)
    );
  }
}

