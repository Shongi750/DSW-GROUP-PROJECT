import { GOAL_COPY, GOAL_SCALE, formatAmount, roundHalf } from '../data/goals';
import { getRecipe } from '../data/recipes';
import { STAPLES } from '../data/saFoods';

export function scaleMeal(recipeId, goalId = 'maintain') {
  const recipe = getRecipe(recipeId);
  if (!recipe) return null;
  const scale = GOAL_SCALE[goalId] || GOAL_SCALE.maintain;

  const ingredients = recipe.portions.map((item) => {
    const factor = scale[item.role] || 1;
    const amount = roundHalf(item.amount * factor) || 0.5;
    const carbs = Math.round(item.carbs * factor);
    const protein = Math.round(item.protein * factor);
    return {
      ...item,
      amount,
      carbs,
      protein,
      display: formatAmount(amount, item.unit),
    };
  });

  const carbs = ingredients.reduce((sum, item) => sum + item.carbs, 0);
  const protein = ingredients.reduce((sum, item) => sum + item.protein, 0);
  const carbItem = ingredients.find((item) => item.role === 'carbs') || ingredients[0];
  const verb = carbItem.unit === 'cups' ? 'pour' : 'use';

  return {
    ...recipe,
    goalId,
    ingredients,
    carbs,
    protein,
    coach: {
      ...GOAL_COPY[goalId],
      detail: `${GOAL_COPY[goalId].because} You need about ${carbs}g of carbs, so ${verb} ${carbItem.display} of ${carbItem.label}.`,
    },
  };
}

export function stapleLabel(stapleId, products) {
  const live = products?.[stapleId];
  if (live?.name) {
    return live.brand ? `${live.brand} ${live.name}` : live.name;
  }
  return STAPLES[stapleId]?.fallbackName || stapleId;
}
