export const STORE_FILTERS = [
  { id: 'cheapest', label: 'Cheapest', hint: 'Best quote' },
  { id: 'shoprite', label: 'Shoprite', hint: 'This shop' },
  { id: 'checkers', label: 'Checkers', hint: 'This shop' },
  { id: 'picknpay', label: 'Pick n Pay', hint: 'This shop' },
  { id: 'woolworths', label: 'Woolworths', hint: 'This shop' },
];

const ALIASES = {
  shoprite: ['shoprite', 'usave'],
  checkers: ['checkers'],
  picknpay: ['pick n pay', 'picknpay', 'pnp', 'pick-n-pay'],
  woolworths: ['woolworths', 'woolies'],
};

export function storeLabel(storeId) {
  return STORE_FILTERS.find((item) => item.id === storeId)?.label || 'Cheapest mix';
}

export function quoteMatchesStore(quote, storeId) {
  if (!storeId || storeId === 'cheapest') return true;
  const aliases = ALIASES[storeId] || [storeId];
  const name = String(quote?.store || '').toLowerCase();
  return aliases.some((alias) => name.includes(alias));
}

function cheapestQuote(quotes) {
  return quotes.reduce((best, quote) => (quote.price < best.price ? quote : best), quotes[0]);
}

export function applyStore(item, storeId) {
  const quotes = Array.isArray(item.quotes) ? item.quotes.filter((quote) => Number(quote.price) > 0) : [];

  if (!storeId || storeId === 'cheapest') {
    if (!quotes.length) return { ...item, storeFit: true };
    const best = cheapestQuote(quotes);
    return {
      ...item,
      price: best.price,
      store: best.store,
      city: best.city || item.city,
      special: best.special ?? item.special,
      regularPrice: best.regularPrice ?? item.regularPrice,
      storeFit: true,
    };
  }

  const match = quotes.find((quote) => quoteMatchesStore(quote, storeId));
  if (match) {
    return {
      ...item,
      price: match.price,
      store: match.store,
      city: match.city || item.city,
      special: match.special ?? item.special,
      regularPrice: match.regularPrice ?? item.regularPrice,
      storeFit: true,
    };
  }

  if (quoteMatchesStore(item, storeId)) {
    return { ...item, storeFit: true };
  }

  return {
    ...item,
    storeFit: false,
    storeNote: `No ${storeLabel(storeId)} quote yet`,
  };
}

export function applyStoreList(items, storeId) {
  return (items || []).map((item) => applyStore(item, storeId));
}
