import { buildTodayPreview, nameFromId, previewMoves } from '../src/features/workout/lib/todayPreview';

const catalog = {
  'bodyweight-squat': { id: 'bodyweight-squat', name: 'Bodyweight Squat', focus: ['Legs'], mode: 'sets' },
  'free-Barbell_Squat': {
    id: 'free-Barbell_Squat',
    name: 'Barbell Squat',
    focus: ['Quadriceps'],
    gifUrl: 'https://example.com/squat.jpg',
  },
};
const getExercise = (id) => catalog[id] || null;

// Friday 9 Oct 2026
const FRIDAY = new Date(2026, 9, 9, 10, 0, 0);

function trainPlan(count) {
  return {
    type: 'train',
    session: { name: 'Full-body A' },
    trainWeekdays: [1, 3, 5],
    moves: Array.from({ length: count }, (_, i) =>
      i === 0
        ? { id: 'free-Barbell_Squat', mode: 'sets', sets: 4, reps: 6, rest: 120 }
        : { id: 'bodyweight-squat', mode: 'sets', sets: 3, reps: 12, rest: 25 }
    ),
  };
}

describe("today's workout preview", () => {
  test('weekday heading and first six moves', () => {
    const preview = buildTodayPreview({ todayPlan: trainPlan(8), getExercise, date: FRIDAY });
    expect(preview.weekday).toBe('Friday');
    expect(preview.dateLabel).toBe('9 Oct');
    expect(preview.title).toBe('Full-body A');
    expect(preview.items).toHaveLength(6);
    expect(preview.totalMoves).toBe(8);
    expect(preview.moreCount).toBe(2);
    expect(preview.minutes).toBeGreaterThan(0);
    expect(preview.items[0]).toMatchObject({
      number: 1,
      name: 'Barbell Squat',
      meta: '4×6',
      focus: 'Quadriceps',
      image: 'https://example.com/squat.jpg',
    });
  });

  test('short sessions show every move and no "more"', () => {
    const preview = buildTodayPreview({ todayPlan: trainPlan(4), getExercise, date: FRIDAY });
    expect(preview.items).toHaveLength(4);
    expect(preview.moreCount).toBe(0);
  });

  test('rest day names the next training day', () => {
    const saturday = new Date(2026, 9, 10);
    const preview = buildTodayPreview({
      todayPlan: { type: 'rest', moves: [], trainWeekdays: [1, 3, 5] },
      getExercise,
      date: saturday,
    });
    expect(preview.weekday).toBe('Saturday');
    expect(preview.title).toBe('Rest day');
    expect(preview.items).toEqual([]);
    expect(preview.nextTrainDay).toBe('Monday');
  });

  test('done day has no moves', () => {
    const preview = buildTodayPreview({ todayPlan: { type: 'done', moves: [] }, date: FRIDAY });
    expect(preview.title).toBe("You're done for today");
    expect(preview.totalMoves).toBe(0);
  });

  test('missing plan is a safe rest day', () => {
    expect(buildTodayPreview({ date: FRIDAY }).type).toBe('rest');
  });

  test('ids not yet in the catalog still get a readable name', () => {
    expect(nameFromId('free-Barbell_Hip_Thrust')).toBe('Barbell Hip Thrust');
    expect(nameFromId('free-Wide-Grip_Lat_Pulldown')).toBe('Wide Grip Lat Pulldown');
    const rows = previewMoves(['free-Leg_Press'], () => null);
    expect(rows[0].name).toBe('Leg Press');
    expect(rows[0].image).toBeNull();
  });

  test('long timed moves read in minutes', () => {
    const rows = previewMoves([{ id: 'free-Rowing_Stationary', mode: 'timed', duration: 300 }], getExercise);
    expect(rows[0].meta).toBe('5 min');
    const short = previewMoves([{ id: 'cat-cow', mode: 'timed', duration: 45 }], getExercise);
    expect(short[0].meta).toBe('45s');
  });
});
