import {
  mealPlanMediaUrls,
  recipeMediaUrls,
} from '../../../lib/downloads/downloadsCore';
import { latestDownload, saveDownload } from '../../../lib/downloads/downloadsStore';
import { GOALS } from '../data/goals';
import { formatRand } from '../data/planner';
import { scaleMeal } from './portions';
import { groceryListHtml } from './groceryPdf';

// Meal plan / recipe / grocery list downloads. Recipes themselves are built into the app;
// the download keeps the student's plan, live product names and prices, photos and the PDF.

function goalLabel(goal) {
  return GOALS.find((item) => item.id === goal)?.label || 'Maintain';
}

/** Only the products a set of staples needs (keeps the download small). */
export function pickProducts(products, stapleIds) {
  const out = {};
  stapleIds.forEach((id) => {
    if (products?.[id]) out[id] = products[id];
  });
  return out;
}

// --- weekly meal plan ---------------------------------------------------

export function planRefId(budget, goal) {
  return `week-${Number(budget) || 0}-${goal || 'maintain'}`;
}

export function downloadMealPlan({ budget, goal, dietFilters, customByKey, swapByKey, mealsByDay, groceries, storeId, cadence, catalog }) {
  const data = { budget, goal, dietFilters, customByKey, swapByKey, mealsByDay, groceries, storeId, cadence, catalog };
  const mealCount = Object.values(mealsByDay || {}).reduce((sum, list) => sum + (list || []).length, 0);
  return saveDownload({
    kind: 'mealPlan',
    refId: planRefId(budget, goal),
    title: `Week plan · ${formatRand(budget)}`,
    subtitle: `${goalLabel(goal)} · ${mealCount} meals · grocery list included`,
    data,
    media: mealPlanMediaUrls(data),
  });
}

/** The newest downloaded plan's catalog — used when the food catalog can't load offline. */
export async function offlineCatalog() {
  const plan = await latestDownload('mealPlan');
  if (plan?.data?.catalog?.products) return { catalog: plan.data.catalog, savedAt: plan.entry.savedAt };
  const list = await latestDownload('grocery');
  if (list?.data?.products) {
    return { catalog: { products: list.data.products, specials: [], source: 'download', priceSource: 'download' }, savedAt: list.entry.savedAt };
  }
  return null;
}

// --- single recipe ---------------------------------------------------------

export function recipeRefId(meal) {
  return String(meal?.recipeId || meal?.id || '');
}

export function downloadRecipe({ meal, goal, products }) {
  const recipe = scaleMeal(meal.recipeId, goal);
  const staples = (recipe?.ingredients || []).map((item) => item.staple);
  const data = { meal, goal, products: pickProducts(products, staples) };
  return saveDownload({
    kind: 'recipe',
    refId: recipeRefId(meal),
    title: meal.title,
    subtitle: `${meal.slot || 'Meal'} · ${recipe?.time || ''}${recipe?.video?.youtubeId || recipe?.video?.url ? ' · cook video' : ''}`,
    data,
    media: recipeMediaUrls({ image: meal.image, video: recipe?.video }),
  });
}

// --- grocery list ------------------------------------------------------------

export function groceryRefId(storeId, cadence) {
  return `${storeId || 'cheapest'}-${cadence || 'weekly'}`;
}

/**
 * pdfPayload is the same object the "Download PDF" button builds
 * ({ title, subtitle, rows, total, footer }); on the phone the PDF is saved too.
 */
export function downloadGroceryList({ items, products, storeId, cadence, shopLabel, pdfPayload }) {
  const data = { items, products: pickProducts(products, (items || []).map((item) => item.id)), storeId, cadence, pdfPayload };
  return saveDownload({
    kind: 'grocery',
    refId: groceryRefId(storeId, cadence),
    title: `Grocery list · ${shopLabel}`,
    subtitle: pdfPayload?.subtitle || `${(items || []).length} items`,
    data,
    makePdf: pdfPayload?.rows?.length
      ? async () => {
          const Print = await import('expo-print');
          const { uri } = await Print.printToFileAsync({ html: groceryListHtml(pdfPayload) });
          return uri;
        }
      : null,
  });
}
