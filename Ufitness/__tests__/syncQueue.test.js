// Integration-style: real queue + AsyncStorage mock + a fake Supabase client.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockUpserts = [];
let mockNextError = null;
jest.mock('../src/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (table) => ({
      upsert: async (row) => {
        const error = typeof mockNextError === 'function' ? mockNextError(table, row) : mockNextError;
        if (!error) mockUpserts.push({ table, row });
        return { error };
      },
      select: () => ({ limit: async () => ({ error: mockNextError }) }),
    }),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearQueue, flushQueue, onFlushed, pendingWrites, queueWrite } from '../src/lib/syncQueue';
import { getSyncStatus, resetSyncStatus, subscribeSyncStatus } from '../src/lib/syncStatus';

beforeEach(async () => {
  mockUpserts.length = 0;
  mockNextError = null;
  resetSyncStatus();
  await clearQueue();
});

test('offline saves are queued (latest copy) and survive in AsyncStorage', async () => {
  await queueWrite({ table: 'user_docs', uid: 'u1', doc: 'eaten', row: { user_id: 'u1', doc: 'eaten', data: { v: 1 } } });
  await queueWrite({ table: 'user_docs', uid: 'u1', doc: 'eaten', row: { user_id: 'u1', doc: 'eaten', data: { v: 2 } } });
  expect(await pendingWrites('u1')).toBe(1);
  const stored = JSON.parse(await AsyncStorage.getItem('ufitness.syncQueue.v1'));
  expect(stored['user_docs:u1:eaten'].row.data.v).toBe(2);
});

test('flush sends dirty docs, shows Syncing… then Synced, and tells screens to refresh', async () => {
  const heard = [];
  const stop = subscribeSyncStatus((status) => heard.push(status));
  const refreshed = jest.fn();
  const off = onFlushed(refreshed);

  await queueWrite({ table: 'profiles', uid: 'u1', row: { id: 'u1', profile: {} } });
  await queueWrite({ table: 'user_docs', uid: 'u1', doc: 'mealPlans', row: { user_id: 'u1', doc: 'mealPlans', data: {} } });
  await queueWrite({ table: 'user_docs', uid: 'u2', doc: 'mealPlans', row: { user_id: 'u2', doc: 'mealPlans', data: {} } });

  expect(await flushQueue('u1')).toBe('synced');
  expect(mockUpserts.map((u) => u.table)).toEqual(['profiles', 'user_docs']);
  expect(mockUpserts[0].row.updated_at).toBeTruthy();
  expect(heard).toContain('syncing');
  expect(getSyncStatus()).toBe('synced');
  expect(refreshed).toHaveBeenCalledWith('synced');
  expect(await pendingWrites('u1')).toBe(0);
  expect(await pendingWrites('u2')).toBe(1); // other account untouched
  stop();
  off();
});

test('still offline: keeps everything queued and shows Offline', async () => {
  await queueWrite({ table: 'user_docs', uid: 'u1', doc: 'eaten', row: { user_id: 'u1', doc: 'eaten', data: {} } });
  mockNextError = { message: 'TypeError: Network request failed' };
  expect(await flushQueue('u1')).toBe('offline');
  expect(getSyncStatus()).toBe('offline');
  expect(await pendingWrites('u1')).toBe(1);
});

test('a server refusal (e.g. RLS) is dropped so it does not retry forever', async () => {
  await queueWrite({ table: 'user_docs', uid: 'u1', doc: 'communityState', row: { user_id: 'u1', doc: 'communityState', data: {} } });
  mockNextError = { message: 'new row violates row-level security policy', code: '42501' };
  expect(await flushQueue('u1')).toBe('local');
  expect(await pendingWrites('u1')).toBe(0);
});

test('reconnect with an empty queue still refreshes screens', async () => {
  const refreshed = jest.fn();
  const off = onFlushed(refreshed);
  expect(await flushQueue('u1')).toBe('synced');
  expect(refreshed).not.toHaveBeenCalled(); // plain foreground, nothing queued
  expect(await flushQueue('u1', { notify: true })).toBe('synced');
  expect(refreshed).toHaveBeenCalledTimes(1);
  off();
});
