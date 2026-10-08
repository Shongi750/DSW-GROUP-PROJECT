import {
  adminActionError,
  openReportCount,
  reportActions,
  sortReports,
  statusLabel,
  suspendedFromLog,
} from '../src/lib/moderationRules';
import { proxyBody, proxyErrorAction } from '../src/features/meals/lib/loyaltyProxyRules';

const MSG = '3f1c2a4b-1111-4abc-8def-1234567890ab';
const USER = '9a8b7c6d-2222-4abc-9def-abcdefabcdef';

describe('admin report workflow', () => {
  test('open report: resolve, dismiss, delete message, suspend', () => {
    const report = { status: 'open', table: 'group_messages', messageId: MSG, reportedUserId: USER };
    expect(reportActions(report)).toEqual({
      resolve: true, dismiss: true, reopen: false, deleteMessage: true, suspend: true, unsuspend: false,
    });
  });

  test('handled report or other tables: no delete, but can reopen', () => {
    const done = reportActions({ status: 'resolved', table: 'direct_messages', messageId: MSG });
    expect(done).toMatchObject({ resolve: false, dismiss: false, reopen: true, deleteMessage: false });
    expect(reportActions({ status: 'open', table: 'profiles', messageId: MSG }).deleteMessage).toBe(false);
    expect(reportActions({ status: 'open', table: 'group_messages', messageId: 'feed-post-1' }).deleteMessage).toBe(false);
  });

  test('suspended student shows Lift suspension instead', () => {
    const actions = reportActions({ reportedUserId: USER }, { suspendedIds: [USER] });
    expect(actions).toMatchObject({ suspend: false, unsuspend: true });
  });

  test('open first, newest first; counts and labels', () => {
    const rows = [
      { id: 'a', status: 'resolved', createdAt: '2026-10-08T10:00:00Z' },
      { id: 'b', createdAt: '2026-10-07T10:00:00Z' },
      { id: 'c', status: 'open', createdAt: '2026-10-08T09:00:00Z' },
    ];
    expect(sortReports(rows).map((r) => r.id)).toEqual(['c', 'b', 'a']);
    expect(openReportCount(rows)).toBe(2);
    expect(statusLabel('dismissed')).toBe('Dismissed');
    expect(statusLabel(undefined)).toBe('Open');
  });

  test('suspension state is replayed from the moderation log', () => {
    const log = [
      { action: 'suspend', target_user_id: 'u1' },
      { action: 'suspend', target_user_id: 'u2' },
      { action: 'unsuspend', target_user_id: 'u1' },
      { action: 'delete_message', target_user_id: 'u3' },
    ];
    expect(suspendedFromLog(log)).toEqual(['u2']);
  });

  test('friendly admin errors', () => {
    expect(adminActionError({ message: 'only Campus Admin can moderate' })).toBe('Only Campus Admin can do that.');
    expect(adminActionError({ message: 'Could not find the function public.admin_resolve_report' })).toMatch(/moderation.sql/);
    expect(adminActionError({ message: 'Failed to fetch' })).toMatch(/No connection/);
  });
});

describe('LoyaltyHub proxy rules', () => {
  test('only the two endpoints the app uses are allowed', () => {
    expect(proxyBody('/prices', { search: ' rice ', limit: 50 })).toEqual({ endpoint: 'prices', params: { search: 'rice', limit: '10' } });
    expect(proxyBody('/products', { barcode: '6001234567890' })).toEqual({ endpoint: 'products', params: { barcode: '6001234567890' } });
    expect(proxyBody('/prices', { search: 'r' })).toBeNull();
    expect(proxyBody('/products', { barcode: 'abc' })).toBeNull();
    expect(proxyBody('/admin', {})).toBeNull();
  });

  test('when to fall back to estimates', () => {
    expect(proxyErrorAction(undefined)).toBe('fallback');
    expect(proxyErrorAction(404)).toBe('fallback');
    expect(proxyErrorAction(503)).toBe('fallback');
    expect(proxyErrorAction(401)).toBe('fallback');
    expect(proxyErrorAction(429)).toBe('rate_limit');
    expect(proxyErrorAction(502, 'LoyaltyHub key rejected')).toBe('rejected');
    expect(proxyErrorAction(400, 'bad request')).toBe('error');
  });
});
