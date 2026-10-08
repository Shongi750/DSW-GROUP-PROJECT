// What to do when the loyaltyhub-proxy Edge Function call fails.
// No React Native imports, so this is easy to unit test.
//
// 'fallback'   → function not deployed / no key on the server / not signed in /
//                offline: use the old direct call (only if a key is still in .env)
//                or estimated prices.
// 'rejected'   → LoyaltyHub refused the server key.
// 'rate_limit' → too many requests; stop for now.
// 'error'      → anything else (bad request, LoyaltyHub down).
export function proxyErrorAction(status, message = '') {
  const text = String(message || '');
  if (!status) return 'fallback'; // fetch/relay error: function unreachable
  if (status === 404 || status === 503 || status === 401) return 'fallback';
  if (status === 429 || /rate limit/i.test(text)) return 'rate_limit';
  if (/key rejected/i.test(text)) return 'rejected';
  return 'error';
}

/** Body sent to the Edge Function. Returns null when the request isn't allowed. */
export function proxyBody(path, params = {}) {
  if (path === '/prices') {
    const search = String(params.search || '').trim();
    if (search.length < 2) return null;
    return { endpoint: 'prices', params: { search: search.slice(0, 80), limit: String(Math.min(Number(params.limit) || 10, 10)) } };
  }
  if (path === '/products') {
    const barcode = String(params.barcode || '').trim();
    if (!/^\d{6,14}$/.test(barcode)) return null;
    return { endpoint: 'products', params: { barcode } };
  }
  return null;
}
