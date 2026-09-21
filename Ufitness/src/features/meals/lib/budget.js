export const WEEKS_PER_MONTH = 4.33;
const MIN_WEEKLY = 120;

export function weeklyFromMonthly(monthlyAmount) {
  const monthly = Number(monthlyAmount);
  if (!Number.isFinite(monthly) || monthly <= 0) return Math.round(1500 / WEEKS_PER_MONTH);
  return Math.max(MIN_WEEKLY, Math.round(monthly / WEEKS_PER_MONTH));
}

export function nearestWeeklyBudget(weeklyAmount) {
  const target = Number(weeklyAmount);
  if (!Number.isFinite(target) || target <= 0) return weeklyFromMonthly(1500);
  return Math.max(MIN_WEEKLY, Math.round(target));
}

export function weekPlanOptions(monthlyAmount) {
  const plan = weeklyFromMonthly(monthlyAmount);
  const tight = Math.max(MIN_WEEKLY, Math.round(plan * 0.7));
  const flush = Math.round(plan * 1.3);
  const rows = [{ id: plan, label: `R${plan}`, hint: 'Your week' }];
  if (tight !== plan) rows.unshift({ id: tight, label: `R${tight}`, hint: 'Tight week' });
  if (flush !== plan) rows.push({ id: flush, label: `R${flush}`, hint: 'Flush week' });
  return rows;
}

export function isNsfas(fundingType) {
  return String(fundingType || '').toLowerCase().includes('nsfas');
}

export function budgetsForFunding(monthlyAmount) {
  return weekPlanOptions(monthlyAmount);
}

export function weeklyForFunding(monthlyAmount) {
  return weeklyFromMonthly(monthlyAmount);
}

export function groceryTotalFromList(groceries = []) {
  return (groceries || [])
    .filter((item) => item.needed !== false)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);
}

export function remainingAfterGrocery(weeklyBudget, groceryTotal) {
  return Math.max(0, Math.round(Number(weeklyBudget || 0) - Number(groceryTotal || 0)));
}

export function resolveWeeklyBudget(savedBudget, monthlyAmount) {
  const options = weekPlanOptions(monthlyAmount);
  if (options.some((item) => item.id === savedBudget)) return savedBudget;
  return weeklyFromMonthly(monthlyAmount);
}
