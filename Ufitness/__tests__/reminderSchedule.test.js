import {
  allReminderIds,
  buildSchedule,
  normalizeReminders,
  reminderSummary,
  toExpoWeekday,
} from '../src/lib/notifications/reminderSchedule';

describe('reminderSchedule', () => {
  test('old saved settings load with defaults', () => {
    const state = normalizeReminders({ groceryDay: true, gymCheckIn: false, lastGym: '2026-10-08' });
    expect(state.groceryDay).toBe(true);
    expect(state.lastGym).toBe('2026-10-08');
    expect(state.workout).toEqual({ enabled: false, hour: 17, minute: 0, days: [1, 2, 3, 4, 5] });
    expect(state.meals.lunch).toEqual({ enabled: false, hour: 12, minute: 30 });
  });

  test('bad values are clamped / dropped', () => {
    const state = normalizeReminders({ workout: { enabled: 1, hour: 99, minute: -5, days: [0, 9, 3, 3, 'x'] } });
    expect(state.workout).toEqual({ enabled: true, hour: 23, minute: 0, days: [0, 3] });
    expect(normalizeReminders('nope').workout.enabled).toBe(false);
  });

  test('JS weekday → Expo weekday (Sunday = 1)', () => {
    expect(toExpoWeekday(0)).toBe(1);
    expect(toExpoWeekday(1)).toBe(2);
    expect(toExpoWeekday(6)).toBe(7);
  });

  test('nothing on → nothing scheduled', () => {
    expect(buildSchedule(null)).toEqual([]);
    expect(reminderSummary(null)).toBe('All reminders off');
  });

  test('workout reminder schedules one weekly alert per chosen day', () => {
    const items = buildSchedule({ workout: { enabled: true, hour: 6, minute: 45, days: [1, 3, 5] } });
    expect(items.map((i) => i.identifier)).toEqual(['workout-1', 'workout-3', 'workout-5']);
    expect(items[0].trigger).toEqual({ type: 'weekly', weekday: 2, hour: 6, minute: 45, channelId: 'reminders' });
  });

  test('meal reminders are daily; grocery + gym keep their 09:00 slots', () => {
    const items = buildSchedule({
      meals: { dinner: { enabled: true, hour: 19, minute: 15 } },
      groceryDay: true,
      gymCheckIn: true,
    });
    const dinner = items.find((i) => i.identifier === 'meal-dinner');
    expect(dinner.trigger).toEqual({ type: 'daily', hour: 19, minute: 15, channelId: 'reminders' });
    expect(items.filter((i) => i.identifier.startsWith('grocery-'))).toHaveLength(2);
    expect(items.filter((i) => i.identifier.startsWith('gym-'))).toHaveLength(5);
    expect(items.find((i) => i.identifier === 'grocery-saturday').trigger.weekday).toBe(7);
  });

  test('every scheduled id is in the cancel list', () => {
    const everything = buildSchedule({
      workout: { enabled: true, days: [0, 1, 2, 3, 4, 5, 6] },
      meals: { breakfast: { enabled: true }, lunch: { enabled: true }, dinner: { enabled: true } },
      groceryDay: true,
      gymCheckIn: true,
    });
    const ids = new Set(allReminderIds());
    expect(everything.every((i) => ids.has(i.identifier))).toBe(true);
    expect(reminderSummary({ workout: { enabled: true, hour: 7, minute: 0 }, groceryDay: true })).toBe(
      'Workout 07:00 · Grocery day'
    );
  });
});
