const PEANUT = new Set(['peanut_butter']);
const FISH = new Set(['pilchards', 'tuna', 'salmon']);
const DAIRY = new Set(['milk', 'yoghurt', 'cheese']);
const MEAT_FISH = new Set([
  'chicken',
  'wors',
  'polony',
  'pilchards',
  'tuna',
  'beef',
  'steak',
  'lamb',
  'salmon',
]);
const NOT_HALAAL = new Set(['wors', 'polony']);

export const EMPTY_DIET_FILTERS = {
  halaal: false,
  vegetarian: false,
  noDairy: false,
  noPeanuts: false,
  noFish: false,
};

export function mergeDietFilters(value) {
  return { ...EMPTY_DIET_FILTERS, ...(value && typeof value === 'object' ? value : {}) };
}

export function dietHasFlags(value) {
  return Object.values(mergeDietFilters(value)).some(Boolean);
}

export function mealAllowed(meal, filters = EMPTY_DIET_FILTERS) {
  const ids = meal?.ingredients || [];
  if (filters.halaal && ids.some((id) => NOT_HALAAL.has(id))) return false;
  if (filters.vegetarian && ids.some((id) => MEAT_FISH.has(id))) return false;
  if (filters.noDairy && ids.some((id) => DAIRY.has(id))) return false;
  if (filters.noPeanuts && ids.some((id) => PEANUT.has(id))) return false;
  if (filters.noFish && ids.some((id) => FISH.has(id))) return false;
  return true;
}
