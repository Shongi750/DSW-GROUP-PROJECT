import { CADENCES, PERISHABLE_IDS } from '../data/groceryExtras';
import { extrasCatalog } from './saFoodApi';

export { CADENCES };

function productToItem(id, item, needed) {
  return {
    id,
    name: `${item.name}${item.pack ? ` (${item.pack})` : ''}`,
    brand: item.brand || '',
    price: Number(item.price) || 0,
    regularPrice: item.regularPrice,
    special: Boolean(item.special),
    checked: Boolean(needed),
    needed: Boolean(needed),
    live: item.live,
    priceLive: item.priceLive,
    store: item.store || '',
    city: item.city || '',
    priceDate: item.priceDate || '',
    code: item.code || '',
    image: item.image || '',
    quotes: item.quotes || [],
    priceSource: item.priceSource || '',
  };
}

export function expandGroceryList(planItems = [], products = {}) {
  const byId = {};
  const extras = extrasCatalog();

  Object.entries(extras).forEach(([id, item]) => {
    byId[id] = productToItem(id, item, false);
  });
  Object.entries(products).forEach(([id, item]) => {
    byId[id] = productToItem(id, item, false);
  });
  planItems.forEach((item) => {
    byId[item.id] = {
      ...byId[item.id],
      ...item,
      needed: true,
      checked: item.checked !== false,
    };
  });

  return Object.values(byId).sort((a, b) => {
    if (a.needed !== b.needed) return a.needed ? -1 : 1;
    if (a.special !== b.special) return a.special ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function scaleForCadence(items, cadence) {
  return items.map((item) => {
    const perishable = PERISHABLE_IDS.has(item.id);
    if (cadence === 'daily') {
      const qty = perishable ? 1 : item.needed ? 1 : 1;
      const linePrice = perishable ? item.price : Math.round((item.price / 7) * 100) / 100;
      return {
        ...item,
        qty,
        linePrice,
        qtyLabel: perishable ? 'today' : 'share of weekly pack',
      };
    }
    if (cadence === 'monthly') {
      const qty = 4;
      return {
        ...item,
        qty,
        linePrice: Math.round(item.price * qty * 100) / 100,
        qtyLabel: perishable ? '4 shops' : '4 packs',
      };
    }
    return {
      ...item,
      qty: 1,
      linePrice: item.price,
      qtyLabel: '1 pack',
    };
  });
}

export function matchesQuery(item, query) {
  const hay = `${item.name} ${item.brand} ${item.store} ${item.city}`.toLowerCase();
  return hay.includes(query.trim().toLowerCase());
}
