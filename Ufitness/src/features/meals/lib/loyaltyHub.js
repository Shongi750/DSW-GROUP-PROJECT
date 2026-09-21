const BASE = 'https://loyaltyhub.co.za/api/v1';

const RETAILER_NAMES = {
  shoprite: 'Shoprite',
  checkers: 'Checkers',
  'pick-n-pay': 'Pick n Pay',
  picknpay: 'Pick n Pay',
  pnp: 'Pick n Pay',
  woolworths: 'Woolworths',
  clicks: 'Clicks',
  makro: 'Makro',
  spar: 'SPAR',
  usave: 'Usave',
};

export function loyaltyHubKey() {
  return String(process.env.EXPO_PUBLIC_LOYALTYHUB_KEY || '').trim();
}

export function hasLoyaltyHubKey() {
  const key = loyaltyHubKey();
  return Boolean(key) && !key.includes('your_key');
}

function headers() {
  const key = loyaltyHubKey();
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${key}`,
    'x-api-key': key,
  };
}

export function retailerLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return RETAILER_NAMES[raw.toLowerCase()] || raw.replace(/[-_]/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function rowPrice(row) {
  const value = Number(row?.price ?? row?.current_price ?? row?.special_price);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function rowWas(row) {
  const value = Number(row?.was_price ?? row?.regular_price ?? row?.price_without_discount ?? row?.previous_price);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function rowSpecial(row, cheapest, dearest) {
  if (row?.on_special || row?.is_special || row?.special || row?.is_on_promotion) return true;
  const was = rowWas(row);
  const price = rowPrice(row);
  if (was && price && price < was * 0.98) return true;
  return Boolean(dearest && cheapest && price === cheapest && price <= dearest * 0.9);
}

function flattenProductPayload(data, barcode) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.prices)) {
    return data.prices.map((row) => ({
      ...data,
      ...row,
      barcode: row.barcode || data.barcode || barcode,
      name: row.name || data.name || data.product_name,
      brand: row.brand || data.brand,
      image_url: row.image_url || data.image_url,
    }));
  }
  if (data.prices && typeof data.prices === 'object') {
    return Object.entries(data.prices).map(([retailer, row]) => ({
      ...data,
      ...(row && typeof row === 'object' ? row : { price: row }),
      retailer: row?.retailer || retailer,
      barcode: data.barcode || barcode,
    }));
  }
  return [data];
}

function groupRows(rows = []) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = String(row.barcode || row.ean || `${row.name || ''}|${row.brand || ''}`).toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.values()];
}

function scoreGroup(rows, term) {
  const hay = `${rows[0]?.name || ''} ${rows[0]?.brand || ''}`.toLowerCase();
  const tokens = String(term || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const hits = tokens.filter((token) => hay.includes(token)).length;
  return hits * 10 + rows.length;
}

export function summariseLoyaltyRows(rows = []) {
  const usable = rows
    .map((row) => ({
      raw: row,
      price: rowPrice(row),
      was: rowWas(row),
      store: retailerLabel(row.retailer || row.store || row.chain),
      city: row.city || row.suburb || row.store_name || '',
      barcode: row.barcode || row.ean || '',
      name: row.name || row.product_name || '',
      brand: row.brand || '',
      image: row.image_url || row.image || '',
      date: row.updated_at || row.date || '',
      inStock: row.in_stock !== false,
    }))
    .filter((row) => row.price > 0 && row.store);

  if (!usable.length) return null;

  usable.sort((a, b) => a.price - b.price);
  const cheapest = usable[0].price;
  const dearest = usable[usable.length - 1].price;
  const best = usable[0];
  const special = rowSpecial(best.raw, cheapest, dearest) || (dearest > 0 && best.price <= dearest * 0.9);

  return {
    price: Math.round(best.price * 100) / 100,
    regularPrice: best.was || (special ? dearest : null),
    special,
    store: best.store,
    city: best.city,
    date: String(best.date).slice(0, 10),
    barcode: best.barcode,
    name: best.name,
    brand: best.brand,
    image: best.image,
    live: true,
    quotes: usable.slice(0, 5).map((row) => ({
      store: row.store,
      price: row.price,
      city: row.city,
      special: rowSpecial(row.raw, cheapest, dearest),
    })),
  };
}

async function getJson(path, params = {}) {
  if (!hasLoyaltyHubKey()) return null;
  const search = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''))
  );
  const url = `${BASE}${path}${search.toString() ? `?${search}` : ''}`;
  const response = await fetch(url, { headers: headers() });
  if (response.status === 401 || response.status === 403) {
    throw new Error('LoyaltyHub key rejected');
  }
  if (response.status === 429) {
    throw new Error('LoyaltyHub rate limit');
  }
  if (!response.ok) {
    throw new Error(`LoyaltyHub ${response.status}`);
  }
  return response.json();
}

export async function searchLoyaltyPrices(term, limit = 10) {
  if (!term) return [];
  const json = await getJson('/prices', { search: term, limit: String(Math.min(Number(limit) || 10, 10)) });
  const rows = json?.data || json?.items || [];
  return Array.isArray(rows) ? rows : [];
}

export async function loyaltyProductByBarcode(barcode) {
  if (!barcode) return [];
  const json = await getJson('/products', { barcode: String(barcode) });
  return flattenProductPayload(json?.data, barcode);
}

export async function quoteForSearch(term) {
  const rows = await searchLoyaltyPrices(term);
  const ranked = groupRows(rows).sort((a, b) => scoreGroup(b, term) - scoreGroup(a, term));
  return summariseLoyaltyRows(ranked[0] || []);
}

export async function quoteForBarcode(barcode) {
  const rows = await loyaltyProductByBarcode(barcode);
  return summariseLoyaltyRows(rows);
}
