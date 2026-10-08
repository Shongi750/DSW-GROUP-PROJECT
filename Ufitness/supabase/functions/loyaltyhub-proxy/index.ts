// loyaltyhub-proxy — Supabase Edge Function (Deno).
// Keeps the LoyaltyHub API key on the server. The app calls this with
// supabase.functions.invoke('loyaltyhub-proxy', { body: { endpoint, params } }).
//
// - Needs a signed-in user's JWT (the public anon key alone is refused).
// - Only proxies the two endpoints the app uses:
//     prices   -> GET /prices?search=&limit=   (grocery search / price quotes)
//     products -> GET /products?barcode=       (price by barcode)
// - The key comes from the LOYALTYHUB_KEY secret (supabase secrets set ...).
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOYALTYHUB_BASE = 'https://loyaltyhub.co.za/api/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type ProxyRequest = { path: string; query: URLSearchParams } | { error: string };

// Turn { endpoint, params } into a safe LoyaltyHub path + query (allow-list only).
function buildRequest(body: any): ProxyRequest {
  const endpoint = String(body?.endpoint || '');
  const params = body?.params && typeof body.params === 'object' ? body.params : {};
  const query = new URLSearchParams();

  if (endpoint === 'prices') {
    const search = String(params.search || '').trim();
    if (search.length < 2 || search.length > 80) return { error: 'search must be 2–80 characters' };
    const limit = Math.min(Math.max(parseInt(String(params.limit || '10'), 10) || 10, 1), 10);
    query.set('search', search);
    query.set('limit', String(limit));
    return { path: '/prices', query };
  }

  if (endpoint === 'products') {
    const barcode = String(params.barcode || '').trim();
    if (!/^\d{6,14}$/.test(barcode)) return { error: 'barcode must be 6–14 digits' };
    query.set('barcode', barcode);
    return { path: '/products', query };
  }

  return { error: 'unknown endpoint' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'use POST' }, 405);

  const key = Deno.env.get('LOYALTYHUB_KEY') ?? '';
  if (!key) return json({ error: 'LoyaltyHub key not configured' }, 503);

  // 1) Must be a signed-in UFitness user.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'sign in first' }, 401);
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: 'sign in first' }, 401);

  // 2) Only the endpoints the app uses.
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'send JSON' }, 400);
  }
  const built = buildRequest(body);
  if ('error' in built) return json({ error: built.error }, 400);

  // 3) Call LoyaltyHub with the secret key.
  let upstream: Response;
  try {
    upstream = await fetch(`${LOYALTYHUB_BASE}${built.path}?${built.query}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${key}`, 'x-api-key': key },
    });
  } catch {
    return json({ error: 'LoyaltyHub unreachable' }, 502);
  }

  if (upstream.status === 401 || upstream.status === 403) return json({ error: 'LoyaltyHub key rejected' }, 502);
  if (upstream.status === 429) return json({ error: 'LoyaltyHub rate limit' }, 429);
  if (!upstream.ok) return json({ error: `LoyaltyHub ${upstream.status}` }, 502);

  const data = await upstream.json().catch(() => null);
  return json(data ?? {});
});
