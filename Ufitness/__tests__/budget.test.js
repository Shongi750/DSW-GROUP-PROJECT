import {
  weeklyFromMonthly,
  nearestWeeklyBudget,
  weekPlanOptions,
  isNsfas,
  groceryTotalFromList,
  remainingAfterGrocery,
  resolveWeeklyBudget,
} from '../src/features/meals/lib/budget';

describe('meals budget', () => {
  test('monthly budget becomes a weekly amount (4.33 weeks per month)', () => {
    expect(weeklyFromMonthly(1500)).toBe(346);
    expect(weeklyFromMonthly(2000)).toBe(462);
  });

  test('weekly budget never drops below R120', () => {
    expect(weeklyFromMonthly(100)).toBe(120);
    expect(nearestWeeklyBudget(50)).toBe(120);
  });

  test('bad input falls back to the R1500 default', () => {
    expect(weeklyFromMonthly('abc')).toBe(346);
    expect(weeklyFromMonthly(-5)).toBe(346);
    expect(nearestWeeklyBudget(undefined)).toBe(346);
  });

  test('week options are tight, normal and flush', () => {
    const options = weekPlanOptions(1500);
    expect(options.map((o) => o.hint)).toEqual(['Tight week', 'Your week', 'Flush week']);
    expect(options.map((o) => o.id)).toEqual([242, 346, 450]);
  });

  test('NSFAS is detected in any casing', () => {
    expect(isNsfas('NSFAS bursary')).toBe(true);
    expect(isNsfas('Self-funded')).toBe(false);
    expect(isNsfas(null)).toBe(false);
  });

  test('grocery total skips items marked not needed', () => {
    const list = [{ price: 20 }, { price: '15.5' }, { price: 100, needed: false }];
    expect(groceryTotalFromList(list)).toBe(35.5);
    expect(groceryTotalFromList(null)).toBe(0);
  });

  test('remaining budget is never negative', () => {
    expect(remainingAfterGrocery(300, 120)).toBe(180);
    expect(remainingAfterGrocery(100, 250)).toBe(0);
  });

  test('saved budget is kept only if it is one of the options', () => {
    expect(resolveWeeklyBudget(242, 1500)).toBe(242);
    expect(resolveWeeklyBudget(999, 1500)).toBe(346);
  });
});
