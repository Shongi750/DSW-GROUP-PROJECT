import { GOAL_COPY, formatAmount } from '../data/goals';
import { STAPLE_FOODS, requiredClasses, scorePlate } from '../data/foodClasses';
import { stapleLabel } from './portions';

export { STAPLE_FOODS, scorePlate };

export function plateCoach(slot, goalId, score) {
  const copy = GOAL_COPY[goalId] || GOAL_COPY.maintain;
  const meal = slot.toLowerCase();
  const needed = requiredClasses(slot);

  if (score.complete) {
    const labels = score.classes
      .filter((item) => item.required)
      .map((item) => item.label.toLowerCase())
      .join(', ');
    return `${copy.because} This ${meal} covers ${labels} — about ${score.totals.carbs}g carbs and ${score.totals.protein}g protein.`;
  }

  if (score.missing.length === needed.length) {
    const labels = score.missing.map((item) => item.label.toLowerCase()).join(', ');
    return `${copy.because} Your own ${meal} still needs ${labels}. Add from the pantry until every class ticks.`;
  }

  const next = score.missing[0];
  if (!next?.suggest) {
    return `${copy.because} Add a ${next?.label.toLowerCase() || 'staple'} so this ${meal} still hits your plate.`;
  }

  const verb = next.id === 'starch' ? 'pour' : 'add';
  const nutrient =
    next.id === 'starch'
      ? `${next.remaining}g of carbs`
      : next.id === 'protein'
        ? `${next.remaining}g of protein`
        : 'a veg class';
  return `${copy.because} You still need ${nutrient}, so ${verb} ${next.suggest.display} of ${next.suggest.label}.`;
}

export function describePick(pick) {
  const food = STAPLE_FOODS[pick.staple];
  if (!food) return pick.staple;
  return `${formatAmount(pick.amount, food.unit)} ${food.label}`;
}

export function buildCustomMeal({ dayId, slot, goalId, name, picks, products, score }) {
  const title = (name || '').trim() || `Your own ${slot.toLowerCase()}`;
  const heroId = picks[0]?.staple;
  const hero = products?.[heroId];
  const classesHit = score.classes.filter((item) => item.required && item.met).map((item) => item.label);
  return {
    id: `${dayId}-own-${slot}`,
    dayId,
    slot,
    custom: true,
    recipeId: null,
    title,
    description: score.complete
      ? `Your dish hits ${classesHit.join(', ')} for ${goalId}.`
      : 'Still missing a food class for this slot.',
    image: hero?.image || hero?.fallbackImage || 'https://images.unsplash.com/photo-1498837164418-9e039318b1b5?w=900&q=80',
    kcal: Math.round(score.totals.carbs * 4 + score.totals.protein * 4 + 40),
    tags: [
      { label: 'Your dish', tone: 'balanced' },
      ...classesHit.map((label) => ({
        label,
        tone: label === 'Protein' ? 'protein' : label === 'Starch' ? 'carbs' : 'balanced',
      })),
    ],
    ingredients: picks.map((item) => item.staple),
    picks,
    costPerServe: 0,
    minBudget: 0,
  };
}

export function pantryLabel(stapleId, products) {
  const food = STAPLE_FOODS[stapleId];
  const live = stapleLabel(stapleId, products);
  return food ? `${food.label}` : live;
}
