// Progress must survive sign-out / sign-in and belong to auth.uid().
import {
  mergeProfiles,
  pickLocalWorkoutProfile,
  resolveProfileForUser,
  workoutProfileKeyFor,
} from '../src/features/workout/lib/profileMerge';

const UID = '3f2b8c1e-9a4d-4e5f-8b6a-1c2d3e4f5a6b';
const OTHER = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const EMAIL = '221234567@student.uj.ac.za';
const session = (id, date) => ({ id, date, exerciseIds: ['squat'], minutes: 30 });

describe('per-account workout cache key', () => {
  test('keyed by uid, shared key when signed out', () => {
    expect(workoutProfileKeyFor('workoutapp.profile.v1', UID)).toBe(`workoutapp.profile.v1:${UID}`);
    expect(workoutProfileKeyFor('workoutapp.profile.v1', null)).toBe('workoutapp.profile.v1');
  });
});

describe('pickLocalWorkoutProfile', () => {
  const mine = { ownerUid: UID, history: [session('a', '2026-10-01')] };
  const theirs = { ownerUid: OTHER, history: [session('x', '2026-10-02')] };

  test('per-account cache wins (sign-out cleared the shared copy)', () => {
    const blankShared = { history: [] };
    expect(pickLocalWorkoutProfile({ perUser: mine, active: blankShared, uid: UID, email: EMAIL })).toBe(mine);
  });

  test('falls back to the shared copy only when it is ours', () => {
    expect(pickLocalWorkoutProfile({ perUser: null, active: mine, uid: UID, email: EMAIL })).toBe(mine);
    expect(pickLocalWorkoutProfile({ perUser: null, active: theirs, uid: UID, email: EMAIL })).toBeNull();
  });

  test('migrates data from an old offline build with the same email', () => {
    const legacy = { ownerUid: `local-${EMAIL}`, history: [session('old', '2026-09-30')] };
    expect(pickLocalWorkoutProfile({ perUser: null, active: legacy, uid: UID, email: EMAIL })).toBe(legacy);
  });
});

describe('resolveProfileForUser', () => {
  test('cloud empty: keeps our own local progress', () => {
    const local = { ownerUid: UID, history: [session('a', '2026-10-01')] };
    const out = resolveProfileForUser({ localProfile: local, remoteProfile: null, uid: UID, email: EMAIL });
    expect(out.history).toHaveLength(1);
    expect(out.ownerUid).toBe(UID);
  });

  test("cloud empty: never adopts another student's local progress", () => {
    const local = { ownerUid: OTHER, history: [session('x', '2026-10-01')] };
    const out = resolveProfileForUser({ localProfile: local, remoteProfile: null, uid: UID, email: EMAIL });
    expect(out.history).toBeUndefined();
    expect(out.ownerUid).toBe(UID);
  });

  test('cloud + local are unioned so no session is lost', () => {
    const local = { ownerUid: UID, history: [session('a', '2026-10-01')], updatedAt: '2026-10-01T10:00:00Z' };
    const remote = { history: [session('b', '2026-10-03')], updatedAt: '2026-10-03T10:00:00Z' };
    const out = resolveProfileForUser({ localProfile: local, remoteProfile: remote, uid: UID, email: EMAIL });
    expect(out.history.map((h) => h.id)).toEqual(['b', 'a']);
  });

  test('legacy local-<email> progress is merged into the real account once', () => {
    const local = { ownerUid: `local-${EMAIL}`, history: [session('old', '2026-09-30')] };
    const remote = { history: [session('new', '2026-10-05')] };
    const out = resolveProfileForUser({ localProfile: local, remoteProfile: remote, uid: UID, email: EMAIL });
    expect(out.history.map((h) => h.id).sort()).toEqual(['new', 'old']);
    expect(out.ownerUid).toBe(UID);
  });

  test("another student's local copy is ignored when the cloud has ours", () => {
    const local = { ownerUid: OTHER, history: [session('x', '2026-10-01')] };
    const remote = { history: [session('b', '2026-10-03')] };
    const out = resolveProfileForUser({ localProfile: local, remoteProfile: remote, uid: UID, email: EMAIL });
    expect(out.history.map((h) => h.id)).toEqual(['b']);
  });

  test('mergeProfiles keeps the best lastSets from both sides', () => {
    const out = mergeProfiles(
      { lastSets: { squat: { reps: 5, weightKg: 60 } } },
      { lastSets: { squat: { reps: 8, weightKg: 50 }, bench: { reps: 5, weightKg: 40 } } }
    );
    expect(out.lastSets.squat.weightKg).toBe(60);
    expect(out.lastSets.bench.weightKg).toBe(40);
  });
});
