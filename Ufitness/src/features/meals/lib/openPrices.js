import { Platform } from 'react-native';

const USER_AGENT = 'UFitnessMeals/1.0 (meal-planner@ufitness.local)';
const PRICES_URL = 'https://prices.openfoodfacts.org/api/v1/prices';

function headers() {
  const next = { Accept: 'application/json' };
  if (Platform.OS !== 'web') {
    next['User-Agent'] = USER_AGENT;
  }
  return next;
}

function plausible(price, estimate) {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return false;
  if (!estimate) return value < 500;
  return value >= estimate * 0.2 && value <= estimate * 4;
}

function storeName(item) {
  return item.location?.osm_brand || item.location?.osm_name || '';
}

function summarise(items = [], estimate) {
  const usable = items.filter((item) => {
    const inZa =
      item.currency === 'ZAR' &&
      (item.location?.osm_address_country_code === 'ZA' ||
        item.location?.osm_address_country === 'South Africa' ||
        !item.location);
    return inZa && plausible(item.price, estimate);
  });
  if (!usable.length) return null;

  usable.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const cheapest = [...usable].sort((a, b) => Number(a.price) - Number(b.price))[0];
  const latest = usable[0];
  const sample = usable.slice(0, 6).map((item) => Number(item.price));
  const avg = sample.reduce((sum, value) => sum + value, 0) / sample.length;
  const regular = Number(cheapest.price_without_discount) || Math.round(avg * 100) / 100;
  const special =
    cheapest.price_is_discounted ||
    (regular > 0 && Number(cheapest.price) <= regular * 0.9);

  return {
    price: Math.round(Number(cheapest.price) * 100) / 100,
    regularPrice: regular,
    special,
    discountType: cheapest.discount_type || (special ? 'special' : ''),
    store: storeName(cheapest) || storeName(latest),
    city: cheapest.location?.osm_address_city || latest.location?.osm_address_city || '',
    date: cheapest.date || latest.date || '',
    live: true,
  };
}

export async function fetchZarPriceByCode(code, estimate) {
  if (!code) return null;
  const params = new URLSearchParams({
    product_code: String(code),
    currency: 'ZAR',
    order_by: '-date',
    size: '20',
  });
  const response = await fetch(`${PRICES_URL}?${params.toString()}`, { headers: headers() });
  if (!response.ok) throw new Error(`Open Prices ${response.status}`);
  const json = await response.json();
  return summarise(json.items, estimate);
}

export async function fetchZarPricesByCodes(products) {
  const entries = Object.entries(products).filter(([, item]) => item.code);
  const results = await Promise.allSettled(
    entries.map(([, item]) => fetchZarPriceByCode(item.code, item.price))
  );

  let liveCount = 0;
  entries.forEach(([id], index) => {
    const hit = results[index].status === 'fulfilled' ? results[index].value : null;
    if (!hit) return;
    products[id] = {
      ...products[id],
      price: hit.price,
      regularPrice: hit.regularPrice,
      special: hit.special,
      discountType: hit.discountType,
      priceLive: true,
      store: hit.store,
      city: hit.city,
      priceDate: hit.date,
    };
    liveCount += 1;
  });

  return liveCount;
}

export function mapSpecial(item) {
  const price = Number(item.price);
  if (!Number.isFinite(price) || price <= 0) return null;
  const name = item.product?.product_name || item.product_name || 'Grocery special';
  const store = storeName(item);
  if (!store && !item.location?.osm_address_city) return null;
  return {
    id: `special-${item.id}`,
    name,
    brand: item.product?.brands?.split(',')[0]?.trim() || '',
    price,
    regularPrice: Number(item.price_without_discount) || null,
    special: Boolean(item.price_is_discounted) || Boolean(item.price_without_discount),
    store,
    city: item.location?.osm_address_city || '',
    date: item.date || '',
    image: item.product?.image_url || '',
    code: item.product_code || item.product?.code || '',
    priceLive: true,
  };
}

export async function fetchZarSpecials() {
  const queries = [
    { currency: 'ZAR', price_is_discounted: 'true', order_by: '-date', size: '30' },
    { currency: 'ZAR', order_by: '-date', size: '40' },
  ];

  const pages = await Promise.allSettled(
    queries.map(async (query) => {
      const params = new URLSearchParams(query);
      const response = await fetch(`${PRICES_URL}?${params.toString()}`, { headers: headers() });
      if (!response.ok) throw new Error(`Open Prices ${response.status}`);
      return response.json();
    })
  );

  const seen = new Set();
  const specials = [];
  pages.forEach((page) => {
    if (page.status !== 'fulfilled') return;
    (page.value.items || []).forEach((item) => {
      const mapped = mapSpecial(item);
      if (!mapped) return;
      const key = `${mapped.code}-${mapped.store}-${mapped.price}`;
      if (seen.has(key)) return;
      seen.add(key);
      specials.push(mapped);
    });
  });

  specials.sort((a, b) => Number(Boolean(b.special)) - Number(Boolean(a.special)));
  return specials.slice(0, 24);
}
