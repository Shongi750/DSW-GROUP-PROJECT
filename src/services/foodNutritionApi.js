const OPEN_FOOD_FACTS_URL = 'https://world.openfoodfacts.org/api/v2/search';
const nutritionCache = new Map();

function normalizeProduct(product) {
  const nutriments = product.nutriments || {};
  const calories = nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? null;

  return {
    name: product.product_name || product.generic_name || 'Unknown product',
    calories,
    protein: nutriments.proteins_100g ?? null,
    carbohydrates: nutriments.carbohydrates_100g ?? null,
    fat: nutriments.fat_100g ?? null,
  };
}

export async function lookupFoodNutrition(foodName) {
  const query = foodName.trim().toLowerCase();
  if (!query) return null;
  if (nutritionCache.has(query)) return nutritionCache.get(query);

  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '1',
    fields: 'product_name,generic_name,nutriments',
  });

  try {
    const response = await fetch(`${OPEN_FOOD_FACTS_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) throw new Error(`Open Food Facts request failed: ${response.status}`);

    const data = await response.json();
    const product = data.products?.[0];
    const result = product ? normalizeProduct(product) : null;
    nutritionCache.set(query, result);
    return result;
  } catch (error) {
    console.warn(`Nutrition lookup unavailable for ${foodName}:`, error.message);
    return null;
  }
}

export async function lookupFoodsNutrition(foodNames) {
  const uniqueNames = [...new Set(foodNames.filter(Boolean))];
  return Promise.all(
    uniqueNames.map(async (foodName) => ({
      foodName,
      nutrition: await lookupFoodNutrition(foodName),
    }))
  );
}
