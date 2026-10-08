import { applyPlanAdaptation, planAdaptationMessage } from '../src/features/workout/data/planAdaptation';

// Sessions on old dates, so no "current streak" kicks in.
function history(count) {
  return Array.from({ length: count }, (_, i) => ({
    date: `2020-01-${String((i % 28) + 1).padStart(2, '0')}`,
    title: `Session ${i + 1}`,
  }));
}

describe('workout plan adaptation', () => {
  test('no message before the first session', () => {
    expect(planAdaptationMessage([], {})).toBeNull();
    expect(planAdaptationMessage(null, null)).toBeNull();
  });

  test('first session starts the plan', () => {
    expect(planAdaptationMessage(history(1), {}).title).toBe('Your plan is live');
  });

  test('three sessions moves a new lifter to returning', () => {
    const { patch, message } = applyPlanAdaptation({ experience: 'new' }, history(3));
    expect(patch.experience).toBe('returning');
    expect(message.title).toBe('Consistency unlocked');
  });

  test('five sessions adds one extra set (planBoost 1)', () => {
    const { patch, message } = applyPlanAdaptation({ experience: 'returning' }, history(5));
    expect(patch.planBoost).toBe(1);
    expect(message.body).toContain('+1 set');
  });

  test('ten sessions raises planBoost to 2', () => {
    expect(applyPlanAdaptation({ planBoost: 1 }, history(10)).patch.planBoost).toBe(2);
  });

  test('twelve sessions moves returning to trained', () => {
    expect(applyPlanAdaptation({ experience: 'returning' }, history(12)).patch.experience).toBe('trained');
  });

  test('negative planBoost is treated as 0 and does not change the profile object', () => {
    const profile = { planBoost: -3, experience: 'trained' };
    const { patch } = applyPlanAdaptation(profile, history(2));
    expect(patch).toEqual({});
    expect(profile.planBoost).toBe(-3);
  });
});
