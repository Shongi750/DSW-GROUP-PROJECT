import {
  badgeFor,
  clearFlushed,
  dirtyFor,
  isOfflineError,
  markDirty,
  pendingCount,
  queueKey,
} from '../src/lib/syncQueueCore';

const row = (n) => ({ user_id: 'u1', doc: 'mealPlans', data: { n } });

describe('sync queue core', () => {
  test('keys separate profiles and each user doc', () => {
    expect(queueKey('profiles', 'u1')).toBe('profiles:u1');
    expect(queueKey('user_docs', 'u1', 'eaten')).toBe('user_docs:u1:eaten');
  });

  test('latest local copy wins for the same doc', () => {
    let q = markDirty({}, { table: 'user_docs', uid: 'u1', doc: 'mealPlans', row: row(1) }, 100);
    q = markDirty(q, { table: 'user_docs', uid: 'u1', doc: 'mealPlans', row: row(2) }, 200);
    expect(pendingCount(q, 'u1')).toBe(1);
    expect(q['user_docs:u1:mealPlans'].row.data.n).toBe(2);
    expect(q['user_docs:u1:mealPlans'].updatedAt).toBe(200);
  });

  test('ignores incomplete writes and does not mutate the old queue', () => {
    const q = {};
    expect(markDirty(q, { table: 'user_docs', uid: '', row: row(1) })).toBe(q);
    const next = markDirty(q, { table: 'profiles', uid: 'u1', row: { id: 'u1' } }, 5);
    expect(q).toEqual({});
    expect(Object.keys(next)).toEqual(['profiles:u1']);
  });

  test('clearFlushed keeps a copy saved during the flush', () => {
    let q = markDirty({}, { table: 'user_docs', uid: 'u1', doc: 'eaten', row: row(1) }, 100);
    // flush started with version 100, but the student saved again at 150
    q = markDirty(q, { table: 'user_docs', uid: 'u1', doc: 'eaten', row: row(2) }, 150);
    q = clearFlushed(q, 'user_docs:u1:eaten', 100);
    expect(pendingCount(q, 'u1')).toBe(1);
    q = clearFlushed(q, 'user_docs:u1:eaten', 150);
    expect(pendingCount(q, 'u1')).toBe(0);
    expect(clearFlushed(q, 'missing', 1)).toBe(q);
  });

  test('dirtyFor only returns this user, oldest first', () => {
    let q = markDirty({}, { table: 'user_docs', uid: 'u1', doc: 'b', row: row(1) }, 300);
    q = markDirty(q, { table: 'user_docs', uid: 'u2', doc: 'a', row: row(1) }, 100);
    q = markDirty(q, { table: 'profiles', uid: 'u1', row: { id: 'u1' } }, 200);
    expect(dirtyFor(q, 'u1').map((item) => item.key)).toEqual(['profiles:u1', 'user_docs:u1:b']);
    expect(dirtyFor(null, 'u1')).toEqual([]);
  });

  test('isOfflineError spots network failures only', () => {
    expect(isOfflineError({ message: 'TypeError: Network request failed' })).toBe(true);
    expect(isOfflineError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isOfflineError({ message: 'Load failed' })).toBe(true);
    expect(isOfflineError({ message: '', status: 0 })).toBe(true);
    expect(isOfflineError({ message: 'new row violates row-level security policy', code: '42501' })).toBe(false);
    expect(isOfflineError({ code: 'PGRST205', message: 'table not found' })).toBe(false);
    expect(isOfflineError(null)).toBe(false);
  });

  test('badge: Offline, then Syncing…, then Synced', () => {
    expect(badgeFor({ online: false, flushing: false })).toBe('offline');
    expect(badgeFor({ online: true, flushing: true })).toBe('syncing');
    expect(badgeFor({ online: true, flushing: false })).toBe('synced');
    expect(badgeFor({ online: true, flushing: false, lastResult: 'missing' })).toBe('missing');
  });
});
