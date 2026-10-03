import { scaleMeal } from './portions';

// Student-friendly daily targets by meal goal (MFP-style diary).
export const GOAL_TARGETS = {
  cut: { kcal: 1800, protein: 140, carbs: 160 },
  maintain: { kcal: 2200, protein: 120, carbs: 220 },
  bulk: { kcal: 2800, protein: 150, carbs: 320 },
};

export function targetsForGoal(goalId = 'maintain') {
  return GOAL_TARGETS[goalId] || GOAL_TARGETS.maintain;
}

export function dayMacroPlan(meals = [], goalId = 'maintain') {
  return meals.reduce(
    (acc, meal) => {
      const scaled = meal?.recipeId ? scaleMeal(meal.recipeId, goalId) : null;
      return {
        kcal: acc.kcal + (Number(meal?.kcal) || 0),
        protein: acc.protein + (Number(scaled?.protein) || Number(meal?.protein) || 0),
        carbs: acc.carbs + (Number(scaled?.carbs) || Number(meal?.carbs) || 0),
      };
    },
    { kcal: 0, protein: 0, carbs: 0 }
  );
}

export function mealProtein(meal, goalId = 'maintain') {
  if (!meal) return 0;
  if (meal.protein != null) return Number(meal.protein) || 0;
  const scaled = meal.recipeId ? scaleMeal(meal.recipeId, goalId) : null;
  return Number(scaled?.protein) || 0;
}
