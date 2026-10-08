// Report reasons + block filtering for chats and the community feed.
// No React Native imports, so this is easy to unit test.

// ids must match the chat_reports reason check in supabase/schema.sql
export const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or scam' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'hate', label: 'Hate speech' },
  { id: 'sexual', label: 'Sexual content' },
  { id: 'unsafe_advice', label: 'Unsafe training or diet advice' },
  { id: 'other', label: 'Something else' },
];

export function isValidReason(id) {
  return REPORT_REASONS.some((reason) => reason.id === id);
}

export function reasonLabel(id) {
  const found = REPORT_REASONS.find((reason) => reason.id === id);
  return found ? found.label : 'Other';
}

/** Short copy of the message for the admin (they can't open every chat). */
export function reportExcerpt(text, max = 300) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function toSet(blocked) {
  if (blocked instanceof Set) return blocked;
  return new Set((blocked || []).filter(Boolean).map(String));
}

export function isBlocked(blocked, userId) {
  if (!userId) return false;
  return toSet(blocked).has(String(userId));
}

/**
 * Drop items written by blocked users.
 * getAuthorId(item) returns the author's id (or a name key for feed posts).
 * Your own items are never hidden.
 */
export function filterBlocked(items, blocked, getAuthorId, myId) {
  const set = toSet(blocked);
  if (!set.size) return items || [];
  return (items || []).filter((item) => {
    const author = getAuthorId(item);
    if (!author || (myId && author === myId)) return true;
    return !set.has(String(author));
  });
}

/** Feed posts have no account id, so we block those by a name key. */
export function nameKey(name) {
  const clean = String(name || '').trim().toLowerCase();
  return clean ? `name:${clean}` : '';
}
