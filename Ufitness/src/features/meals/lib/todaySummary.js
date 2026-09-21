import { DAYS, todayDayId } from '../data/planner';
import { SA_MEALS } from '../data/saFoods';
import { resolveWeeklyBudget } from './budget';
import { buildWeekPlan, hydrateMeal, overlayWeekMeals } from './buildWeekPlan';
import { mealAllowed, mergeDietFilters } from './diet';
import { scaleMeal } from './portions';

function calendarDayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

export function pickBudgetDailyMeal(weeklyBudget, filters, date = new Date()) {
  const budget = Number(weeklyBudget) || 0;
  const allowed = SA_MEALS.filter((meal) => meal.minBudget <= budget && mealAllowed(meal, filters));
  const pool = allowed.length ? allowed : SA_MEALS.filter((meal) => mealAllowed(meal, filters));
  const floor = Math.max(0, Math.round(budget * 0.28));
  const spenders = pool.filter((meal) => meal.minBudget >= floor);
  const use = spenders.length ? spenders : pool;
  const ranked = [...use].sort((a, b) => {
    const aFit = Math.abs((a.minBudget || 0) - budget);
    const bFit = Math.abs((b.minBudget || 0) - budget);
    if (aFit !== bFit) return aFit - bFit;
    return String(a.id).localeCompare(String(b.id));
  });
  const bandLimit = Math.max(80, Math.round(budget * 0.15));
  const band = ranked.filter((meal) => Math.abs((meal.minBudget || 0) - budget) <= bandLimit);
  const rotate = band.length >= 3 ? band : ranked;
  return rotate[calendarDayIndex(date) % rotate.length] || null;
}

export function buildTodayMealSummary({ saved, catalog, monthlyBudget, fundingType, dietFilters }) {
  const weeklyBudget = resolveWeeklyBudget(saved?.budget, monthlyBudget, fundingType);
  const goalId = saved?.goal || 'maintain';
  const filters = mergeDietFilters(dietFilters || saved?.dietFilters);
  const plan = buildWeekPlan(weeklyBudget, catalog, filters);
  const mealsByDay = overlayWeekMeals(plan, {
    customByKey: saved?.customByKey || {},
    swapByKey: saved?.swapByKey || {},
    products: catalog?.products || {},
    filters,
  });
  const dayId = todayDayId();
  const day = DAYS.find((item) => item.id === dayId);
  const meals = mealsByDay[dayId] || [];
  const kcal = meals.reduce((sum, meal) => sum + Number(meal.kcal || 0), 0);
  const template = pickBudgetDailyMeal(weeklyBudget, filters);
  const featured = template ? hydrateMeal(template, catalog?.products || {}, dayId) : meals[0] || null;
  const scaled = featured ? scaleMeal(featured.recipeId, goalId) : null;
  const proteinTag = featured?.tags?.some((tag) => /protein/i.test(tag.label));

  return {
    dayId,
    dayName: day?.name || 'Today',
    weeklyBudget,
    kcal,
    meals,
    featured: featured
      ? {
          title: featured.title,
          image: featured.image,
          kcal: featured.kcal,
          protein: scaled?.protein ?? 0,
          tag: proteinTag ? 'POST-WORKOUT' : featured.slot || 'MEAL',
        }
      : null,
  };
}
