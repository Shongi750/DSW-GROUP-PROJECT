import { Platform } from 'react-native';
import { GROCERY_EXTRAS } from '../data/groceryExtras';
import { STAPLES } from '../data/saFoods';
import { hasLoyaltyHubKey, quoteForBarcode, quoteForSearch, searchLoyaltyPrices, summariseLoyaltyRows } from './loyaltyHub';
import { fetchZarPriceByCode, fetchZarPricesByCodes } from './openPrices';

const USER_AGENT = 'UFitnessMeals/1.0 (meal-planner@ufitness.local)';
const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const ALL_FOODS = { ...STAPLES, ...GROCERY_EXTRAS };

let cache = null;
let inflight = null;

function pickProduct(products = []) {
  return products.find((item) => item.product_name && (item.image_url || item.brands)) || products[0] || null;
}

async function searchSouthAfricaAll(term, limit = 8) {
  const params = new URLSearchParams({
    search_terms: term,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(limit),
    tagtype_0: 'countries',
    tag_contains_0: 'contains',
    tag_0: 'south-africa',
    fields: 'code,product_name,brands,image_url,image_front_url,nutriments,quantity',
  });

  const headers = { Accept: 'application/json' };
  if (Platform.OS !== 'web') {
    headers['User-Agent'] = USER_AGENT;
  }

  const response = await fetch(`${SEARCH_URL}?${params.toString()}`, { headers });
  if (!response.ok) throw new Error(`Open Food Facts ${response.status}`);
  const json = await response.json();
  return json.products || [];
}

async function searchSouthAfrica(term) {
  const products = await searchSouthAfricaAll(term, 8);
  return pickProduct(products);
}

function toStapleProduct(id, staple, remote) {
  const kcal = Math.round(remote?.nutriments?.['energy-kcal_100g'] || remote?.nutriments?.['energy-kcal'] || 0);
  return {
    id,
    name: remote?.product_name?.trim() || staple.fallbackName,
    brand: remote?.brands?.split(',')[0]?.trim() || '',
    pack: staple.pack,
    price: staple.price,
    image: remote?.image_url || remote?.image_front_url || staple.fallbackImage,
    kcal100g: kcal,
    live: Boolean(remote?.product_name),
    priceLive: false,
    store: '',
    city: '',
    priceDate: '',
    code: remote?.code || '',
    quotes: [],
    priceSource: '',
  };
}

async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        results[index] = { status: 'fulfilled', value: await mapper(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

function applyQuote(product, quote, source) {
  if (!quote) return product;
  return {
    ...product,
    name: product.live ? product.name : quote.name || product.name,
    brand: product.brand || quote.brand || '',
    price: quote.price,
    regularPrice: quote.regularPrice,
    special: quote.special,
    priceLive: true,
    priceSource: source,
    store: quote.store,
    city: quote.city,
    priceDate: quote.date,
    image: quote.image || product.image,
    code: product.code || quote.barcode || '',
    quotes: quote.quotes || [],
  };
}

export async function fetchSaStaples() {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    const entries = Object.entries(ALL_FOODS);
    const products = {};
    let liveCount = 0;

    const remoteIds = entries.filter(([, staple]) => staple.query).map(([id]) => id);
    const results = await Promise.allSettled(
      remoteIds.map((id) => searchSouthAfrica(ALL_FOODS[id].query))
    );

    remoteIds.forEach((id, index) => {
      const remote = results[index].status === 'fulfilled' ? results[index].value : null;
      products[id] = toStapleProduct(id, ALL_FOODS[id], remote);
      if (products[id].live) liveCount += 1;
    });

    entries
      .filter(([, staple]) => !staple.query)
      .forEach(([id, staple]) => {
        products[id] = toStapleProduct(id, staple, null);
      });

    let loyaltyCount = 0;
    let loyaltyError = '';
    if (hasLoyaltyHubKey()) {
      let stopError = '';
      const quoted = await mapPool(entries, 3, async ([id, staple]) => {
        if (stopError) return null;
        try {
          if (products[id].code) {
            const byCode = await quoteForBarcode(products[id].code);
            if (byCode) return byCode;
          }
          return quoteForSearch(staple.query || staple.fallbackName);
        } catch (error) {
          const message = error?.message || 'LoyaltyHub failed';
          if (/rejected|401|403|key|rate limit/i.test(message)) stopError = message;
          throw error;
        }
      });
      quoted.forEach((result, index) => {
        const [id] = entries[index];
        if (result.status !== 'fulfilled') {
          loyaltyError = result.reason?.message || stopError || 'LoyaltyHub failed';
          return;
        }
        if (!result.value) return;
        products[id] = applyQuote(products[id], result.value, 'loyaltyhub');
        loyaltyCount += 1;
      });
      if (stopError) loyaltyError = stopError;
    }

    let priceCount = loyaltyCount;
    if (!loyaltyCount) {
      try {
        priceCount = await fetchZarPricesByCodes(products);
      } catch {
        priceCount = 0;
      }
    } else {
      const missing = Object.fromEntries(
        Object.entries(products).filter(([, item]) => !item.priceLive && item.code)
      );
      if (Object.keys(missing).length) {
        try {
          await fetchZarPricesByCodes(missing);
          Object.entries(missing).forEach(([id, item]) => {
            if (item.priceLive) products[id] = item;
          });
        } catch {
          /* keep LoyaltyHub prices */
        }
      }
    }

    const specials = Object.values(products)
      .filter((item) => item.special && item.priceLive)
      .map((item) => ({
        id: `deal-${item.id}`,
        name: item.name,
        brand: item.brand,
        price: item.price,
        regularPrice: item.regularPrice,
        special: true,
        store: item.store,
        city: item.city,
        date: item.priceDate,
        image: item.image,
        code: item.code,
        priceLive: true,
        quotes: item.quotes,
      }));

    cache = {
      products,
      liveCount,
      priceCount,
      loyaltyCount,
      loyaltyError,
      specials,
      source: liveCount ? 'openfoodfacts' : 'local',
      priceSource: loyaltyCount ? 'loyaltyhub' : priceCount ? 'openprices' : 'estimate',
    };
    return cache;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

export function fallbackSaStaples() {
  const products = Object.fromEntries(
    Object.entries(ALL_FOODS).map(([id, staple]) => [id, toStapleProduct(id, staple, null)])
  );
  return {
    products,
    liveCount: 0,
    priceCount: 0,
    loyaltyCount: 0,
    loyaltyError: '',
    specials: [],
    source: 'local',
    priceSource: 'estimate',
  };
}

export function extrasCatalog() {
  return Object.fromEntries(
    Object.entries(GROCERY_EXTRAS).map(([id, staple]) => [id, toStapleProduct(id, staple, null)])
  );
}

export async function searchGroceryProducts(term) {
  const query = String(term || '').trim();
  if (query.length < 2) return [];

  if (hasLoyaltyHubKey()) {
    const rows = await searchLoyaltyPrices(query, 10).catch(() => []);
    const grouped = new Map();
    rows.forEach((row) => {
      const key = String(row.barcode || row.ean || `${row.name || query}|${row.retailer || row.store || grouped.size}`);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(row);
    });
    const hits = [...grouped.values()]
      .map((group, index) => {
        const quote = summariseLoyaltyRows(group);
        if (!quote) return null;
        return {
          id: `lh-${quote.barcode || index}-${quote.price}`,
          name: quote.name || query,
          brand: quote.brand,
          price: quote.price,
          regularPrice: quote.regularPrice,
          special: quote.special,
          checked: false,
          needed: false,
          live: true,
          priceLive: true,
          priceSource: 'loyaltyhub',
          store: quote.store,
          city: quote.city,
          priceDate: quote.date,
          code: quote.barcode,
          image: quote.image,
          quotes: quote.quotes,
          fromSearch: true,
        };
      })
      .filter(Boolean);
    if (hits.length) return hits;
  }

  const products = await searchSouthAfricaAll(query, 12);
  return Promise.all(
    products.slice(0, 8).map(async (remote, index) => {
      let item = toStapleProduct(`search-${remote.code || index}-${Date.now()}`, {
        pack: remote.quantity || '',
        price: 0,
        fallbackName: remote.product_name || query,
        fallbackImage: remote.image_url || remote.image_front_url || '',
      }, remote);
      let quote = null;
      if (item.code) {
        quote = await quoteForBarcode(item.code).catch(() => null);
      }
      if (!quote) {
        quote = await fetchZarPriceByCode(item.code, 40).catch(() => null);
      }
      item = applyQuote(item, quote, quote?.quotes ? 'loyaltyhub' : 'openprices');
      return {
        id: item.id,
        name: `${item.name}${item.pack ? ` (${item.pack})` : ''}`,
        brand: item.brand,
        price: item.price || 0,
        regularPrice: item.regularPrice,
        special: item.special,
        checked: false,
        needed: false,
        live: item.live,
        priceLive: item.priceLive,
        priceSource: item.priceSource,
        store: item.store,
        city: item.city,
        priceDate: item.priceDate,
        code: item.code,
        image: item.image,
        quotes: item.quotes,
        fromSearch: true,
      };
    })
  );
}
