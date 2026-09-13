const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

const FUNDING_SOURCES = new Set(['nsfas', 'bursary', 'cash', 'other']);
const PERIODS = new Set(['monthly', 'weekly']);

function asMoney(value, fallback = 0) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : fallback;
}

export function getLocalBudgetConfiguration() {
  return {
    nsfasMonthlyAllowance: asMoney(process.env.EXPO_PUBLIC_NSFAS_MONTHLY_ALLOWANCE, 1700),
    foodAllocationPercent: Math.min(100, asMoney(process.env.EXPO_PUBLIC_FOOD_ALLOCATION_PERCENT, 45)),
    weeksPerMonth: Math.max(1, Number(process.env.EXPO_PUBLIC_WEEKS_PER_MONTH) || 4.345),
  };
}

export function calculateBudgetLocally(input, configuration = getLocalBudgetConfiguration()) {
  const incomeSource = String(input.incomeSource || '').toLowerCase();
  if (!FUNDING_SOURCES.has(incomeSource)) throw new Error('Choose a valid income source.');

  const incomePeriod = String(input.incomePeriod || 'monthly').toLowerCase();
  if (!PERIODS.has(incomePeriod)) throw new Error('Choose a valid income period.');

  const statedIncome = asMoney(input.incomeAmount);
  if (incomeSource !== 'nsfas' && statedIncome <= 0) {
    throw new Error('Enter an amount greater than zero for your funding.');
  }
  if (incomeSource === 'other' && !String(input.otherIncomeSource || '').trim()) {
    throw new Error('Specify your other funding source.');
  }

  const totalFunding = incomeSource === 'nsfas' ? configuration.nsfasMonthlyAllowance : statedIncome;
  const monthlyFunding =
    incomeSource === 'nsfas' || incomePeriod === 'monthly'
      ? totalFunding
      : totalFunding * configuration.weeksPerMonth;
  const essentialAllocations = asMoney(input.essentialAllocations);
  const availableFunding = Math.max(0, monthlyFunding - essentialAllocations);
  const monthlyFoodBudget = availableFunding * (configuration.foodAllocationPercent / 100);
  const weeklyFoodBudget = monthlyFoodBudget / configuration.weeksPerMonth;
  const money = (value) => Math.round(value * 100) / 100;

  return {
    incomeSource,
    incomePeriod,
    otherIncomeSource: incomeSource === 'other' ? String(input.otherIncomeSource).trim() : null,
    totalFunding: money(monthlyFunding),
    essentialAllocations: money(essentialAllocations),
    availableFunding: money(availableFunding),
    monthlyFoodBudget: money(monthlyFoodBudget),
    weeklyFoodBudget: money(weeklyFoodBudget),
    dailyFoodBudget: money(weeklyFoodBudget / 7),
    configuration: {
      foodAllocationPercent: configuration.foodAllocationPercent,
      weeksPerMonth: configuration.weeksPerMonth,
      nsfasMonthlyAllowance: incomeSource === 'nsfas' ? configuration.nsfasMonthlyAllowance : undefined,
    },
  };
}

export async function calculateBudget(input) {
  if (API_URL) {
    try {
      const response = await fetch(`${API_URL}/api/budget/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not calculate budget');
      }
      return data;
    } catch (error) {
      if (error.message && !/network|failed to fetch|timeout/i.test(error.message)) {
        throw error;
      }
    }
  }

  return calculateBudgetLocally(input);
}
