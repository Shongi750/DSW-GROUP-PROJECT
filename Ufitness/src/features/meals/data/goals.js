export const GOALS = [
  { id: 'cut', label: 'Cut', hint: 'Leaner carbs' },
  { id: 'maintain', label: 'Maintain', hint: 'Balanced' },
  { id: 'bulk', label: 'Bulk', hint: 'More carbs' },
];

export const GOAL_SCALE = {
  cut: { carbs: 0.6, protein: 1.15, fat: 0.75, veg: 1.1 },
  maintain: { carbs: 1, protein: 1, fat: 1, veg: 1 },
  bulk: { carbs: 1.7, protein: 1.25, fat: 1.15, veg: 1 },
};

export const GOAL_COPY = {
  cut: {
    title: 'Cut',
    because: 'Because you want to cut, keep protein high and pull carbs back.',
  },
  maintain: {
    title: 'Maintain',
    because: 'Because you want to maintain, use the standard student plate.',
  },
  bulk: {
    title: 'Bulk',
    because: 'Because you want to bulk, you need extra carbs on this plate.',
  },
};

export function roundHalf(value) {
  return Math.round(value * 2) / 2;
}

export function formatAmount(amount, unit) {
  const value = roundHalf(amount);
  if (unit === 'cups') {
    if (value === 0.5) return '½ small cup';
    if (value === 1) return '1 small cup';
    if (value % 1 === 0.5) return `${Math.floor(value)}½ small cups`;
    return `${value} small cups`;
  }
  if (unit === 'slices') return value === 1 ? '1 slice' : `${value} slices`;
  if (unit === 'eggs') return value === 1 ? '1 egg' : `${value} eggs`;
  if (unit === 'tbsp') return value === 1 ? '1 tablespoon' : `${value} tablespoons`;
  if (unit === 'tsp') return value === 1 ? '1 teaspoon' : `${value} teaspoons`;
  if (unit === 'piece') return value === 1 ? '1 piece' : `${value} pieces`;
  return `${value}`;
}
