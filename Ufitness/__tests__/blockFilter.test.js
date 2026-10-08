import {
  REPORT_REASONS,
  filterBlocked,
  isBlocked,
  isValidReason,
  nameKey,
  reasonLabel,
  reportExcerpt,
} from '../src/lib/blockFilter';

const ME = 'me-1';
const messages = [
  { id: 'a', fromId: 'u-1', body: 'hi' },
  { id: 'b', fromId: 'u-2', body: 'spam spam' },
  { id: 'c', fromId: ME, body: 'mine' },
  { id: 'd', fromId: 'u-2', body: 'more spam' },
  { id: 'e', fromId: undefined, body: 'system' },
];
const byFrom = (item) => item.fromId;

describe('block filtering', () => {
  test('hides every message from a blocked user', () => {
    const shown = filterBlocked(messages, new Set(['u-2']), byFrom, ME);
    expect(shown.map((m) => m.id)).toEqual(['a', 'c', 'e']);
  });

  test('accepts an array of ids too', () => {
    expect(filterBlocked(messages, ['u-1', 'u-2'], byFrom, ME).map((m) => m.id)).toEqual(['c', 'e']);
  });

  test('never hides my own messages', () => {
    expect(filterBlocked(messages, [ME], byFrom, ME).map((m) => m.id)).toContain('c');
  });

  test('nothing blocked returns the same list', () => {
    expect(filterBlocked(messages, [], byFrom, ME)).toBe(messages);
    expect(filterBlocked(null, ['u-1'], byFrom)).toEqual([]);
  });

  test('isBlocked', () => {
    expect(isBlocked(['u-1'], 'u-1')).toBe(true);
    expect(isBlocked(new Set(['u-1']), 'u-2')).toBe(false);
    expect(isBlocked(['u-1'], '')).toBe(false);
  });

  test('feed posts are blocked by a name key', () => {
    expect(nameKey('  Thabo M ')).toBe('name:thabo m');
    expect(nameKey('')).toBe('');
    const posts = [{ author: 'Thabo M' }, { author: 'Lerato' }];
    const shown = filterBlocked(posts, [nameKey('thabo m')], (p) => nameKey(p.author));
    expect(shown).toEqual([{ author: 'Lerato' }]);
  });
});

describe('report reasons', () => {
  test('reason ids match the database check list', () => {
    expect(REPORT_REASONS.map((r) => r.id)).toEqual(['spam', 'harassment', 'hate', 'sexual', 'unsafe_advice', 'other']);
    expect(isValidReason('spam')).toBe(true);
    expect(isValidReason('meh')).toBe(false);
    expect(reasonLabel('hate')).toBe('Hate speech');
    expect(reasonLabel('nope')).toBe('Other');
  });

  test('excerpt is trimmed and capped at 300 characters', () => {
    expect(reportExcerpt('  hello \n  there ')).toBe('hello there');
    const long = reportExcerpt('x'.repeat(500));
    expect(long).toHaveLength(300);
    expect(long.endsWith('…')).toBe(true);
    expect(reportExcerpt(null)).toBe('');
  });
});
