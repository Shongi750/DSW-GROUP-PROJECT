import { isMissingTableError, cloudErrorMessage, syncStatusFor, worseStatus } from '../src/lib/cloudErrors';

describe('missing-table detection', () => {
  test.each(['42P01', 'PGRST205', 'PGRST202', 'pgrst205'])('code %s means the cloud is not set up', (code) => {
    expect(isMissingTableError({ code, message: '' })).toBe(true);
  });

  test('messages without a code are detected too', () => {
    expect(isMissingTableError({ message: 'relation "public.user_docs" does not exist' })).toBe(true);
    expect(isMissingTableError({ message: "Could not find the table 'public.usage_events' in the schema cache" })).toBe(true);
    expect(isMissingTableError({ message: 'Could not find the function public.admin_usage_summary' })).toBe(true);
  });

  test('other errors are not missing-table errors', () => {
    expect(isMissingTableError(null)).toBe(false);
    expect(isMissingTableError({ code: '42501', message: 'new row violates row-level security policy' })).toBe(false);
    expect(isMissingTableError({ message: 'Failed to fetch' })).toBe(false);
  });
});

describe('cloud error text and sync status', () => {
  test('friendly messages', () => {
    expect(cloudErrorMessage({ code: '42P01' })).toMatch(/schema\.sql/);
    expect(cloudErrorMessage({ message: 'Failed to fetch' })).toMatch(/No connection/);
    expect(cloudErrorMessage({ message: 'new row violates row-level security policy' })).toBe(
      'You are not allowed to do that.'
    );
  });

  test('sync status from an error', () => {
    expect(syncStatusFor(null)).toBe('synced');
    expect(syncStatusFor({ code: 'PGRST205' })).toBe('missing');
    expect(syncStatusFor({ message: 'timeout' })).toBe('offline');
    expect(syncStatusFor({ message: 'TypeError: Network request failed' })).toBe('offline');
    expect(syncStatusFor({ message: 'new row violates row-level security policy' })).toBe('local');
  });

  test('the worse status wins', () => {
    expect(worseStatus('synced', 'local')).toBe('local');
    expect(worseStatus('missing', 'synced')).toBe('missing');
    expect(worseStatus('local', 'missing')).toBe('missing');
  });
});
