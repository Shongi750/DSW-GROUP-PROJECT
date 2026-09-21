import { DAYS } from '../data/planner';
import { SA_MEALS } from '../data/saFoods';
import { EMPTY_DIET_FILTERS, mealAllowed } from './diet';

function mealsForBudget(budget, filters = EMPTY_DIET_FILTERS) {
  const allowed = SA_MEALS.filter((meal) => meal.minBudget <= budget && mealAllowed(meal, filters));
  if (!allowed.length) return SA_MEALS.filter((meal) => mealAllowed(meal, filters));
  const floor = Math.max(0, Math.round(Number(budget || 0) * 0.28));
  const preferred = allowed.filter((meal) => meal.minBudget >= floor);
  const picked = [];
  ['BREAKFAST', 'LUNCH', 'DINNER'].forEach((slot) => {
    const inPref = preferred.filter((meal) => meal.slot === slot);
    if (inPref.length >= 3) {
      picked.push(...inPref);
      return;
    }
    const extras = allowed
      .filter((meal) => meal.slot === slot && !inPref.some((item) => item.id === meal.id))
      .sort((a, b) => b.minBudget - a.minBudget);
    picked.push(...inPref, ...extras.slice(0, Math.max(0, 3 - inPref.length)));
  });
  return picked.length ? picked : allowed;
}

export function groceryRow(id, item) {
  return {
    id,
    name: `${item.name}${item.pack ? ` (${item.pack})` : ''}`,
    brand: item.brand,
    price: item.price,
    checked: true,
    needed: true,
    live: item.live,
    priceLive: item.priceLive,
    store: item.store,
    city: item.city,
    priceDate: item.priceDate,
    special: item.special,
    regularPrice: item.regularPrice,
    quotes: item.quotes || [],
    priceSource: item.priceSource || '',
    image: item.image || '',
    code: item.code || '',
  };
}

export function hydrateMeal(template, products, dayId) {
  const hero = products[template.ingredients[0]];
  return {
    ...template,
    recipeId: template.id,
    dayId,
    id: `${dayId}-${template.id}`,
    image: template.image || hero?.image || hero?.fallbackImage,
    description: hero?.live
      ? `${template.description} Uses ${hero.brand ? `${hero.brand} ` : ''}${hero.name} from SA shelves.`
      : template.description,
    tags: [
      { label: 'SA food', tone: 'balanced' },
      ...template.tags,
      { label: `R${template.costPerServe} / meal`, tone: 'prep' },
    ],
  };
}

export function slotMeals(budget, slot, filters = EMPTY_DIET_FILTERS) {
  const eligible = SA_MEALS.filter(
    (meal) => meal.slot === slot && meal.minBudget <= budget && mealAllowed(meal, filters)
  );
  if (eligible.length) return eligible;
  const dietOnly = SA_MEALS.filter((meal) => meal.slot === slot && mealAllowed(meal, filters));
  if (dietOnly.length) return dietOnly;
  return SA_MEALS.filter((meal) => meal.slot === slot);
}

export function nextSlotMeal(budget, slot, currentRecipeId, filters = EMPTY_DIET_FILTERS) {
  const options = slotMeals(budget, slot, filters);
  if (!options.length) return null;
  if (options.length === 1) {
    return options[0].id === currentRecipeId ? null : options[0];
  }
  const index = options.findIndex((meal) => meal.id === currentRecipeId);
  const from = index < 0 ? 0 : (index + 1) % options.length;
  return options[from];
}

export function overlayWeekMeals(
  plan,
  { customByKey = {}, swapByKey = {}, products = {}, filters = EMPTY_DIET_FILTERS } = {}
) {
  const mealsByDay = {};
  DAYS.forEach((day) => {
    mealsByDay[day.id] = (plan.mealsByDay?.[day.id] || []).map((meal) => {
      const key = `${day.id}:${meal.slot}`;
      if (customByKey[key]) return customByKey[key];
      const swapId = swapByKey[key];
      if (swapId && swapId !== meal.recipeId) {
        const template = SA_MEALS.find((item) => item.id === swapId);
        if (template && mealAllowed(template, filters)) return hydrateMeal(template, products, day.id);
      }
      return meal;
    });
  });
  return mealsByDay;
}

export function groceriesFromMeals(mealsByDay, products = {}) {
  const used = new Set();
  Object.values(mealsByDay || {}).forEach((dayMeals) => {
    (dayMeals || []).forEach((meal) => {
      (meal.ingredients || []).forEach((id) => used.add(id));
    });
  });
  return [...used]
    .filter((id) => products[id])
    .map((id) => groceryRow(id, products[id]))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeGroceries(derived, previous = []) {
  const prevById = Object.fromEntries((previous || []).map((item) => [item.id, item]));
  const next = derived.map((item) => {
    const prev = prevById[item.id];
    return prev ? { ...item, checked: prev.checked !== false, extra: prev.extra } : item;
  });
  const derivedIds = new Set(derived.map((item) => item.id));
  (previous || []).forEach((item) => {
    if (derivedIds.has(item.id) || !item.extra) return;
    next.push(item);
  });
  next.sort((a, b) => a.name.localeCompare(b.name));
  return next;
}

export function buildWeekPlan(budget, catalog, filters = EMPTY_DIET_FILTERS) {
  const products = catalog.products;
  const eligible = mealsForBudget(budget, filters);
  const bySlot = { BREAKFAST: [], LUNCH: [], DINNER: [] };
  eligible.forEach((meal) => bySlot[meal.slot].push(meal));

  const cheapest = {
    BREAKFAST:
      bySlot.BREAKFAST[0] ||
      SA_MEALS.find((meal) => meal.slot === 'BREAKFAST' && mealAllowed(meal, filters)) ||
      SA_MEALS.find((meal) => meal.slot === 'BREAKFAST'),
    LUNCH:
      bySlot.LUNCH[0] ||
      SA_MEALS.find((meal) => meal.slot === 'LUNCH' && mealAllowed(meal, filters)) ||
      SA_MEALS.find((meal) => meal.slot === 'LUNCH'),
    DINNER:
      bySlot.DINNER[0] ||
      SA_MEALS.find((meal) => meal.slot === 'DINNER' && mealAllowed(meal, filters)) ||
      SA_MEALS.find((meal) => meal.slot === 'DINNER'),
  };

  const mealsByDay = {};
  const used = new Set();
  const weekOffset = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const slotShift = { BREAKFAST: 0, LUNCH: 2, DINNER: 4 };

  DAYS.forEach((day, index) => {
    const rotationIndex = index;
    mealsByDay[day.id] = ['BREAKFAST', 'LUNCH', 'DINNER'].map((slot) => {
      const options = bySlot[slot].length ? bySlot[slot] : [cheapest[slot]];
      const template = options[(rotationIndex + weekOffset + slotShift[slot]) % options.length];
      template.ingredients.forEach((id) => used.add(id));
      return hydrateMeal(template, products, day.id);
    });
  });

  let groceries = [...used]
    .filter((id) => products[id])
    .map((id) => groceryRow(id, products[id]));

  groceries.sort((a, b) => a.name.localeCompare(b.name));

  let total = groceries.reduce((sum, item) => sum + item.price, 0);
  if (total > budget) {
    const extras = ['wors', 'chicken', 'eggs', 'beef', 'steak', 'lamb', 'salmon', 'avocado', 'berries'];
    groceries = groceries.filter((item) => {
      if (total <= budget) return true;
      if (extras.includes(item.id)) {
        total -= item.price;
        return false;
      }
      return true;
    });

    DAYS.forEach((day, index) => {
      mealsByDay[day.id] = mealsByDay[day.id].map((meal) => {
        const stillInBasket = meal.ingredients.every((id) => groceries.some((item) => item.id === id));
        if (stillInBasket) return meal;
        const options = bySlot[meal.slot].length ? bySlot[meal.slot] : [cheapest[meal.slot]];
        const fallback = options[(index + weekOffset + slotShift[meal.slot]) % options.length];
        fallback.ingredients.forEach((id) => {
          if (!groceries.some((item) => item.id === id) && products[id]) {
            const staple = products[id];
            groceries.push(groceryRow(id, staple));
          }
        });
        return hydrateMeal(fallback, products, day.id);
      });
    });
  }

  groceries.sort((a, b) => a.name.localeCompare(b.name));
  const estimated = groceries.reduce((sum, item) => sum + item.price, 0);

  return {
    mealsByDay,
    groceries,
    estimated,
    overBudget: estimated > budget,
    source: catalog.source,
    liveCount: catalog.liveCount,
    priceCount: catalog.priceCount || 0,
    loyaltyCount: catalog.loyaltyCount || 0,
    priceSource: catalog.priceSource || '',
    specials: catalog.specials || [],
    loyaltyError: catalog.loyaltyError || '',
  };
}
