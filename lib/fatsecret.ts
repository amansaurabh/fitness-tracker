import { FoodNutrientsPer100g } from "./usda";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getFatSecretToken(): Promise<string | null> {
  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  // Return cached token if valid for at least 60 more seconds
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.accessToken;
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=basic",
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn("FatSecret token request failed with status:", res.status);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      cachedToken = {
        accessToken: data.access_token,
        expiresAt: Date.now() + (data.expires_in || 86400) * 1000,
      };
      return data.access_token;
    }
  } catch (err) {
    console.error("Error obtaining FatSecret OAuth token:", err);
  }

  return null;
}

export async function searchFatSecretFoods(
  query: string
): Promise<FoodNutrientsPer100g[]> {
  const token = await getFatSecretToken();
  if (!token) return [];

  try {
    const url = new URL("https://platform.fatsecret.com/rest/server.api");
    url.searchParams.set("method", "foods.search.v3");
    url.searchParams.set("search_expression", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("max_results", "10");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.warn("FatSecret foods search failed with status:", res.status);
      return [];
    }

    const data = await res.json();
    const foods = data?.foods?.food;
    if (!foods) return [];

    const foodArray = Array.isArray(foods) ? foods : [foods];

    return foodArray.map((item: any) => {
      // Parse food description string (e.g. "Per 100g - Calories: 165kcal | Fat: 3.60g | Carbs: 0.00g | Protein: 31.02g")
      const desc: string = item.food_description || "";
      const calMatch = desc.match(/Calories:\s*([\d.]+)/i);
      const fatMatch = desc.match(/Fat:\s*([\d.]+)/i);
      const carbMatch = desc.match(/Carbs:\s*([\d.]+)/i);
      const protMatch = desc.match(/Protein:\s*([\d.]+)/i);

      return {
        id: String(item.food_id),
        name: item.food_name,
        caloriesPer100g: calMatch ? parseFloat(calMatch[1]) : 0,
        fatPer100g: fatMatch ? parseFloat(fatMatch[1]) : 0,
        carbsPer100g: carbMatch ? parseFloat(carbMatch[1]) : 0,
        proteinPer100g: protMatch ? parseFloat(protMatch[1]) : 0,
        fiberPer100g: 0,
        source: "usda" as const,
      };
    });
  } catch (err) {
    console.error("FatSecret food search error:", err);
    return [];
  }
}

