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

/** Free-text allergy → ingredient / meal keyword matchers. */
const CUSTOM_ALIASES = {
  egg: ['egg', 'eggs'],
  eggs: ['egg', 'eggs'],
  gluten: ['bread', 'oats', 'maize', 'flour', 'wheat', 'pasta'],
  wheat: ['bread', 'flour', 'wheat', 'pasta'],
  soy: ['soy', 'soya'],
  soya: ['soy', 'soya'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'mussel'],
  prawn: ['shrimp', 'prawn'],
  shrimp: ['shrimp', 'prawn'],
  sesame: ['sesame', 'tahini'],
  nut: ['peanut', 'almond', 'cashew', 'walnut', 'nut'],
  nuts: ['peanut', 'almond', 'cashew', 'walnut', 'nut'],
  'tree nut': ['almond', 'cashew', 'walnut', 'hazelnut', 'pecan'],
  lactose: ['milk', 'yoghurt', 'cheese', 'dairy'],
  milk: ['milk', 'yoghurt', 'cheese'],
  dairy: ['milk', 'yoghurt', 'cheese'],
  peanut: ['peanut'],
  peanuts: ['peanut'],
  fish: ['pilchard', 'tuna', 'salmon', 'fish'],
  chicken: ['chicken'],
  pork: ['wors', 'polony', 'pork'],
  beef: ['beef', 'steak'],
};

export const EMPTY_DIET_FILTERS = {
  halaal: false,
  vegetarian: false,
  noDairy: false,
  noPeanuts: false,
  noFish: false,
  /** Free-text allergies the student typed (e.g. "eggs", "gluten"). */
  customAllergies: [],
};

function normalizeAllergyLabel(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 40);
}

export function normalizeCustomAllergies(list) {
  const source = Array.isArray(list) ? list : [];
  const seen = new Set();
  const out = [];
  source.forEach((item) => {
    const label = normalizeAllergyLabel(item);
    if (!label) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(label);
  });
  return out.slice(0, 24);
}

export function mergeDietFilters(value) {
  const raw = value && typeof value === 'object' ? value : {};
  return {
    ...EMPTY_DIET_FILTERS,
    ...raw,
    customAllergies: normalizeCustomAllergies(raw.customAllergies),
  };
}

export function dietHasFlags(value) {
  const filters = mergeDietFilters(value);
  return (
    filters.halaal ||
    filters.vegetarian ||
    filters.noDairy ||
    filters.noPeanuts ||
    filters.noFish ||
    filters.customAllergies.length > 0
  );
}

function mealSearchBlob(meal) {
  const ids = meal?.ingredients || [];
  const tags = (meal?.tags || []).map((tag) => (typeof tag === 'string' ? tag : tag?.label || ''));
  return [meal?.title, meal?.name, meal?.slot, ...ids, ...tags]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function customAllergyBlocksMeal(meal, allergy) {
  const key = String(allergy || '')
    .trim()
    .toLowerCase();
  if (!key) return false;
  const aliases = CUSTOM_ALIASES[key] || [key];
  const blob = mealSearchBlob(meal);
  const ids = (meal?.ingredients || []).map((id) => String(id).toLowerCase());
  return aliases.some(
    (token) => blob.includes(token) || ids.some((id) => id.includes(token.replace(/\s+/g, '_')))
  );
}

export function mealAllowed(meal, filters = EMPTY_DIET_FILTERS) {
  const next = mergeDietFilters(filters);
  const ids = meal?.ingredients || [];
  if (next.halaal && ids.some((id) => NOT_HALAAL.has(id))) return false;
  if (next.vegetarian && ids.some((id) => MEAT_FISH.has(id))) return false;
  if (next.noDairy && ids.some((id) => DAIRY.has(id))) return false;
  if (next.noPeanuts && ids.some((id) => PEANUT.has(id))) return false;
  if (next.noFish && ids.some((id) => FISH.has(id))) return false;
  if (next.customAllergies.some((allergy) => customAllergyBlocksMeal(meal, allergy))) return false;
  return true;
}

export function addCustomAllergy(filters, raw) {
  const label = normalizeAllergyLabel(raw);
  if (!label) return mergeDietFilters(filters);
  return mergeDietFilters({
    ...filters,
    customAllergies: [...normalizeCustomAllergies(filters?.customAllergies), label],
  });
}

export function removeCustomAllergy(filters, label) {
  const key = String(label || '')
    .trim()
    .toLowerCase();
  return mergeDietFilters({
    ...filters,
    customAllergies: normalizeCustomAllergies(filters?.customAllergies).filter(
      (item) => item.toLowerCase() !== key
    ),
  });
}
