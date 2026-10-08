// Admin report workflow rules (which buttons show, list order).
// No React Native imports, so this is easy to unit test.

export const REPORT_STATUS = {
  open: 'Open',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

// Only these chat tables can have a message deleted by the admin.
const DELETABLE_TABLES = ['group_messages', 'direct_messages'];

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || '')
  );
}

export function statusLabel(status) {
  return REPORT_STATUS[status] || REPORT_STATUS.open;
}

/** Which admin actions make sense for one report. */
export function reportActions(report, { suspendedIds = [] } = {}) {
  const status = report?.status || 'open';
  const open = status === 'open';
  const userId = report?.reportedUserId;
  const alreadySuspended = Boolean(userId) && suspendedIds.includes(userId);
  return {
    resolve: open,
    dismiss: open,
    reopen: !open,
    deleteMessage:
      open && DELETABLE_TABLES.includes(report?.table) && isUuid(report?.messageId) && !report?.messageDeleted,
    suspend: Boolean(userId) && isUuid(userId) && !alreadySuspended,
    unsuspend: alreadySuspended,
  };
}

/** Open reports first, then newest first. */
export function sortReports(rows) {
  return [...(rows || [])].sort((a, b) => {
    const openA = (a.status || 'open') === 'open' ? 0 : 1;
    const openB = (b.status || 'open') === 'open' ? 0 : 1;
    if (openA !== openB) return openA - openB;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

export function openReportCount(rows) {
  return (rows || []).filter((row) => (row.status || 'open') === 'open').length;
}

/** Turn an admin RPC error into short text for the dashboard. */
export function adminActionError(error) {
  const message = String(error?.message || error || '');
  if (/only Campus Admin/i.test(message)) return 'Only Campus Admin can do that.';
  if (/cannot suspend yourself/i.test(message)) return 'You cannot suspend your own account.';
  if (/Admin accounts cannot be suspended/i.test(message)) return 'Campus Admin accounts cannot be suspended.';
  if (/not found/i.test(message)) return 'That item no longer exists.';
  if (/could not find the function|schema cache|PGRST202/i.test(message)) {
    return 'Moderation is not set up in the cloud yet. Run supabase/migrations/2026-10-08-moderation.sql.';
  }
  if (/network|fetch|timeout/i.test(message)) return 'No connection. Try again when you are online.';
  return message || 'Something went wrong. Try again.';
}

/** Replay suspend / unsuspend log rows (oldest first): the last action per student wins. */
export function suspendedFromLog(rows) {
  const state = new Map();
  (rows || []).forEach((row) => {
    if (row?.target_user_id) state.set(row.target_user_id, row.action === 'suspend');
  });
  return [...state.entries()].filter(([, on]) => on).map(([id]) => id);
}
