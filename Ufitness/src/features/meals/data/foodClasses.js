import { GOAL_SCALE, formatAmount, roundHalf } from './goals';

export const FOOD_CLASSES = [
  {
    id: 'starch',
    label: 'Starch',
    hint: 'Pap, rice, bread, oats or potato',
    nutrient: 'carbs',
    unit: 'g carbs',
  },
  {
    id: 'protein',
    label: 'Protein',
    hint: 'Eggs, beans, chicken, pilchards, milk or wors',
    nutrient: 'protein',
    unit: 'g protein',
  },
  {
    id: 'veg',
    label: 'Veg',
    hint: 'Cabbage, tomato relish or beans',
    nutrient: 'veg',
    unit: 'small cups',
  },
];

export const SLOT_REQUIRED = {
  BREAKFAST: ['starch', 'protein'],
  LUNCH: ['starch', 'protein'],
  DINNER: ['starch', 'protein', 'veg'],
};

export const SLOT_TARGETS = {
  BREAKFAST: { carbs: 50, protein: 14, veg: 0 },
  LUNCH: { carbs: 55, protein: 20, veg: 0 },
  DINNER: { carbs: 80, protein: 25, veg: 1.5 },
};

export const STAPLE_FOODS = {
  maize_meal: { classIds: ['starch'], unit: 'cups', step: 0.5, carbs: 55, protein: 4, veg: 0, label: 'dry maize meal' },
  rice: { classIds: ['starch'], unit: 'cups', step: 0.5, carbs: 55, protein: 5, veg: 0, label: 'uncooked white rice' },
  oats: { classIds: ['starch'], unit: 'cups', step: 0.5, carbs: 40, protein: 8, veg: 0, label: 'dry rolled oats' },
  bread: { classIds: ['starch'], unit: 'slices', step: 1, carbs: 15, protein: 3, veg: 0, label: 'brown bread' },
  potatoes: { classIds: ['starch'], unit: 'cups', step: 0.5, carbs: 27, protein: 3, veg: 0, label: 'diced potato' },
  bananas: { classIds: ['starch'], unit: 'piece', step: 1, carbs: 27, protein: 1, veg: 0, label: 'banana' },
  beans: { classIds: ['protein', 'veg'], unit: 'cups', step: 0.5, carbs: 22, protein: 10, veg: 1, label: 'baked beans' },
  eggs: { classIds: ['protein'], unit: 'eggs', step: 1, carbs: 0.5, protein: 6, veg: 0, label: 'eggs' },
  chicken: { classIds: ['protein'], unit: 'cups', step: 0.5, carbs: 0, protein: 28, veg: 0, label: 'cooked chicken' },
  pilchards: { classIds: ['protein'], unit: 'cups', step: 0.25, carbs: 3, protein: 29, veg: 0, label: 'pilchards in tomato' },
  wors: { classIds: ['protein'], unit: 'cups', step: 0.5, carbs: 2, protein: 22, veg: 0, label: 'boerewors' },
  milk: { classIds: ['protein'], unit: 'cups', step: 0.5, carbs: 6, protein: 4, veg: 0, label: 'milk' },
  peanut_butter: { classIds: ['protein'], unit: 'tbsp', step: 1, carbs: 4, protein: 4, veg: 0, label: 'peanut butter' },
  cabbage: { classIds: ['veg'], unit: 'cups', step: 0.5, carbs: 5, protein: 1.5, veg: 1, label: 'shredded cabbage' },
  tomato_sauce: { classIds: ['veg'], unit: 'tbsp', step: 1, carbs: 4, protein: 0, veg: 0.15, label: 'tomato sauce' },
  jam: { classIds: ['starch'], unit: 'tbsp', step: 1, carbs: 9, protein: 0, veg: 0, label: 'jam' },
  yoghurt: { classIds: ['protein'], unit: 'cups', step: 0.5, carbs: 12, protein: 10, veg: 0, label: 'plain yoghurt' },
  cheese: { classIds: ['protein'], unit: 'slices', step: 1, carbs: 1, protein: 5, veg: 0, label: 'cheese slices' },
  tuna: { classIds: ['protein'], unit: 'tin', step: 0.5, carbs: 0, protein: 24, veg: 0, label: 'tinned tuna' },
  polony: { classIds: ['protein'], unit: 'slices', step: 1, carbs: 1, protein: 3, veg: 0, label: 'polony' },
  pasta: { classIds: ['starch'], unit: 'cups', step: 0.5, carbs: 47, protein: 5, veg: 0, label: 'dry pasta' },
  soya: { classIds: ['protein'], unit: 'cups', step: 0.5, carbs: 8, protein: 18, veg: 0, label: 'soya mince' },
  samp: { classIds: ['starch'], unit: 'cups', step: 0.5, carbs: 70, protein: 6, veg: 0, label: 'dry samp' },
  lentils: { classIds: ['protein'], unit: 'cups', step: 0.25, carbs: 20, protein: 14, veg: 0, label: 'dry lentils' },
  spinach: { classIds: ['veg'], unit: 'cups', step: 0.5, carbs: 2, protein: 2, veg: 1, label: 'spinach' },
  sweet_potato: { classIds: ['starch'], unit: 'cups', step: 0.5, carbs: 30, protein: 2, veg: 0.2, label: 'sweet potato' },
  tomatoes: { classIds: ['veg'], unit: 'cups', step: 0.5, carbs: 8, protein: 2, veg: 1, label: 'tomato' },
  maggi: { classIds: ['starch'], unit: 'pack', step: 1, carbs: 50, protein: 8, veg: 0, label: '2-minute noodles' },
  onions: { classIds: ['veg'], unit: 'cups', step: 0.5, carbs: 12, protein: 1, veg: 0.5, label: 'onion' },
  carrots: { classIds: ['veg'], unit: 'cups', step: 0.5, carbs: 12, protein: 1, veg: 1, label: 'carrot' },
  mayo: { classIds: ['protein'], unit: 'tbsp', step: 1, carbs: 0, protein: 0, veg: 0, label: 'mayonnaise' },
};

export const PANTRY_ORDER = [
  'maize_meal',
  'rice',
  'oats',
  'bread',
  'potatoes',
  'pasta',
  'samp',
  'sweet_potato',
  'beans',
  'eggs',
  'chicken',
  'pilchards',
  'tuna',
  'lentils',
  'soya',
  'milk',
  'yoghurt',
  'peanut_butter',
  'cheese',
  'polony',
  'cabbage',
  'spinach',
  'tomatoes',
  'onions',
  'carrots',
  'bananas',
  'wors',
  'jam',
  'maggi',
  'tomato_sauce',
];

export function scaledTargets(slot, goalId = 'maintain') {
  const base = SLOT_TARGETS[slot] || SLOT_TARGETS.DINNER;
  const scale = GOAL_SCALE[goalId] || GOAL_SCALE.maintain;
  return {
    carbs: Math.round(base.carbs * (scale.carbs || 1)),
    protein: Math.round(base.protein * (scale.protein || 1)),
    veg: roundHalf(base.veg * (scale.veg || 1)),
  };
}

export function requiredClasses(slot) {
  return SLOT_REQUIRED[slot] || SLOT_REQUIRED.DINNER;
}

export function sumPicks(picks = []) {
  return picks.reduce(
    (totals, pick) => {
      const food = STAPLE_FOODS[pick.staple];
      if (!food) return totals;
      const amount = pick.amount || 0;
      totals.carbs += food.carbs * amount;
      totals.protein += food.protein * amount;
      totals.veg += food.veg * amount;
      food.classIds.forEach((id) => {
        totals.present[id] = true;
      });
      return totals;
    },
    { carbs: 0, protein: 0, veg: 0, present: {} }
  );
}

function classTarget(classId, targets) {
  if (classId === 'starch') return { have: 'carbs', need: targets.carbs, min: targets.carbs * 0.8 };
  if (classId === 'protein') return { have: 'protein', need: targets.protein, min: targets.protein * 0.8 };
  return { have: 'veg', need: targets.veg, min: targets.veg > 0 ? Math.max(targets.veg * 0.7, 0.5) : 0 };
}

const SUGGEST = {
  starch: { staple: 'rice', fallback: 'maize_meal' },
  protein: { staple: 'beans', fallback: 'eggs' },
  veg: { staple: 'cabbage', fallback: 'beans' },
};

export function suggestForClass(classId, remaining, picks) {
  const used = new Set(picks.map((item) => item.staple));
  const choice = SUGGEST[classId];
  const staple = used.has(choice.staple) && STAPLE_FOODS[choice.fallback] ? choice.fallback : choice.staple;
  const food = STAPLE_FOODS[staple];
  const per = classId === 'starch' ? food.carbs : classId === 'protein' ? food.protein : food.veg;
  const amount = Math.max(food.step, roundHalf(remaining / (per || 1)));
  return {
    staple,
    amount,
    display: formatAmount(amount, food.unit),
    label: food.label,
  };
}

export function scorePlate(picks, slot, goalId) {
  const targets = scaledTargets(slot, goalId);
  const totals = sumPicks(picks);
  const required = requiredClasses(slot);

  const classes = FOOD_CLASSES.map((item) => {
    const spec = classTarget(item.id, targets);
    const value = totals[spec.have];
    const needed = spec.need;
    const remaining = Math.max(0, needed - value);
    const optional = !required.includes(item.id);
    const filled = Boolean(totals.present[item.id]) && value + 0.01 >= spec.min;
    return {
      ...item,
      value: item.id === 'veg' ? roundHalf(value) : Math.round(value),
      needed: item.id === 'veg' ? needed : needed,
      remaining: item.id === 'veg' ? roundHalf(remaining) : Math.round(remaining),
      filled,
      met: optional ? true : filled,
      optional,
      required: required.includes(item.id),
      suggest: remaining > 0 && required.includes(item.id) ? suggestForClass(item.id, remaining, picks) : null,
    };
  });

  const missing = classes.filter((item) => item.required && !item.met);
  return {
    targets,
    totals: {
      carbs: Math.round(totals.carbs),
      protein: Math.round(totals.protein),
      veg: roundHalf(totals.veg),
    },
    classes,
    missing,
    complete: missing.length === 0 && picks.length > 0,
  };
}
