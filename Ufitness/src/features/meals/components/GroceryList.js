import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { CADENCES } from '../data/groceryExtras';
import { formatRand } from '../data/planner';
import { expandGroceryList, matchesQuery, scaleForCadence } from '../lib/grocery';
import { fetchZarSpecials } from '../lib/openPrices';
import { hasLoyaltyHubKey } from '../lib/loyaltyHub';
import { searchGroceryProducts } from '../lib/saFoodApi';
import { applyStore, applyStoreList, quoteMatchesStore, STORE_FILTERS, storeLabel } from '../lib/stores';
import { buildGroceryPdf, downloadPdfBytes, groceryListHtml } from '../lib/groceryPdf';

const NO_SPECIALS = [];

function priceLine(item) {
  const amount = formatRand(item.linePrice ?? item.price);
  const others = (item.quotes || [])
    .filter((quote) => quote.store && quote.store !== item.store)
    .slice(0, 3)
    .map((quote) => `${quote.store} ${formatRand(quote.price)}`)
    .join(' · ');
  if (item.storeFit === false) {
    return `${amount} · ${item.storeNote || 'no quote at this store'}${item.store ? ` · last ${item.store}` : ''}`;
  }
  if (item.special && item.store) {
    return `${amount} special at ${item.store}${item.city ? `, ${item.city}` : ''}${others ? ` · also ${others}` : ''}`;
  }
  if (item.priceLive && item.store) {
    return `${amount} at ${item.store}${item.city ? `, ${item.city}` : ''}${others ? ` · also ${others}` : ''}`;
  }
  if (item.priceLive) return `${amount} · live price`;
  return `${amount} · estimate`;
}

export default function GroceryList({
  items,
  products,
  liveSpecials = NO_SPECIALS,
  priceSource,
  loyaltyError,
  storeId = 'cheapest',
  onStoreChange,
  cadence: cadenceProp,
  onCadenceChange,
  onToggle,
  onAdd,
  onRemove,
}) {
  const insets = useSafeAreaInsets();
  const { colors: theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [localCadence, setLocalCadence] = useState('weekly');
  const cadence = cadenceProp || localCadence;
  const setCadence = onCadenceChange || setLocalCadence;
  const [query, setQuery] = useState('');
  const [specials, setSpecials] = useState([]);
  const [searchHits, setSearchHits] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingSpecials, setLoadingSpecials] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const catalog = useMemo(() => expandGroceryList(items, products), [items, products]);
  const stored = useMemo(() => applyStoreList(catalog, storeId), [catalog, storeId]);
  const scaled = useMemo(() => scaleForCadence(stored, cadence), [stored, cadence]);
  const visibleSpecials = useMemo(() => {
    if (!storeId || storeId === 'cheapest') return specials;
    return specials.filter((item) => quoteMatchesStore(item, storeId));
  }, [specials, storeId]);
  const shopLabel = storeLabel(storeId);
  const filtered = useMemo(() => {
    if (!query.trim()) return scaled;
    return scaled.filter((item) => matchesQuery(item, query));
  }, [scaled, query]);

  const estimated = useMemo(
    () =>
      scaled.filter((item) => item.checked).reduce((sum, item) => sum + Number(item.linePrice || 0), 0),
    [scaled]
  );

  useEffect(() => {
    if (!open) return;
    if (liveSpecials.length) {
      setSpecials(liveSpecials);
      setLoadingSpecials(false);
      return undefined;
    }
    let alive = true;
    setLoadingSpecials(true);
    fetchZarSpecials()
      .then((rows) => {
        if (alive) setSpecials(rows);
      })
      .catch(() => {
        if (alive) setSpecials([]);
      })
      .finally(() => {
        if (alive) setLoadingSpecials(false);
      });
    return () => {
      alive = false;
    };
  }, [open, liveSpecials]);

  useEffect(() => {
    const term = query.trim();
    if (!open || term.length < 2) {
      setSearchHits([]);
      setSearching(false);
      return undefined;
    }
    if (filtered.length > 0) {
      setSearchHits([]);
      setSearching(false);
      return undefined;
    }
    let alive = true;
    setSearching(true);
    const timer = setTimeout(() => {
      searchGroceryProducts(term)
        .then((rows) => {
          if (alive) setSearchHits(rows);
        })
        .catch(() => {
          if (alive) setSearchHits([]);
        })
        .finally(() => {
          if (alive) setSearching(false);
        });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, query, filtered.length]);

  const addItem = () => {
    const trimmed = name.trim();
    const amount = Number(price);
    if (!trimmed || Number.isNaN(amount) || amount < 0) {
      Alert.alert('Add an item', 'Enter a name and a valid price.');
      return;
    }
    onAdd({
      id: `${Date.now()}`,
      name: trimmed,
      price: amount,
      checked: true,
      needed: true,
    });
    setName('');
    setPrice('');
    setAddOpen(false);
  };

  const savePdf = async () => {
    const checked = scaled.filter((item) => item.checked);
    if (!checked.length) {
      Alert.alert('Nothing to download', 'Tick the groceries you want on the list first.');
      return;
    }
    try {
      setSaving(true);
      const cadenceLabel = CADENCES.find((item) => item.id === cadence)?.label || 'Weekly';
      const payload = {
        title: 'UFitness Grocery List',
        subtitle: `${cadenceLabel} shop · ${shopLabel} · ${formatRand(estimated)} · ${checked.length} items`,
        rows: checked.map((item) => ({
          name: `${item.name}${item.qty > 1 ? ` x ${item.qty}` : ''}`,
          store: item.storeFit === false
            ? item.storeNote || `No ${shopLabel} quote`
            : item.special && item.store
              ? `Special at ${item.store}`
              : item.store || (item.priceLive ? 'Live price' : 'Estimate'),
          price: formatRand(item.linePrice ?? item.price),
        })),
        total: formatRand(estimated),
        footer:
          'Live shelf prices and specials from LoyaltyHub (Shoprite, Checkers, Pick n Pay, Woolworths, Clicks, Makro). Gaps fall back to Open Prices receipts.',
      };
      const filename = `ufitness-grocery-${cadence}.pdf`;

      if (Platform.OS === 'web') {
        downloadPdfBytes(buildGroceryPdf(payload), filename);
        return;
      }

      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const { uri } = await Print.printToFileAsync({ html: groceryListHtml(payload) });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Download grocery list',
        });
      } else {
        Alert.alert('PDF ready', 'Your grocery list was saved as a PDF.');
      }
    } catch (error) {
      Alert.alert('Could not download PDF', error?.message || 'Try again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  const cadenceMeta = CADENCES.find((item) => item.id === cadence);

  return (
    <View style={styles.wrap}>
      <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => setOpen(true)}>
        <View style={styles.cardCopy}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Grocery list</Text>
          <Text style={[styles.cardSub, { color: theme.muted }]}>
            {cadenceMeta?.label} · {shopLabel} · {formatRand(estimated)} · tap to open
          </Text>
        </View>
        <Pressable onPress={savePdf} disabled={saving} hitSlop={8} style={styles.cardDownload}>
          <Ionicons name="download-outline" size={20} color={colors.primary} />
        </Pressable>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: theme.background }]}>
          <View style={styles.topBar}>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
              <Text style={styles.backText}>Meals</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 28 }]}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.title, { color: theme.text }]}>Grocery list</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>Pick a store and how often you shop. Search SA shelves if an item is missing.</Text>
            <Text style={styles.sourceNote}>
              {hasLoyaltyHubKey()
                ? priceSource === 'loyaltyhub'
                  ? 'Live shelf prices from LoyaltyHub · Shoprite, Checkers, Pick n Pay, Woolworths, Clicks, Makro.'
                  : loyaltyError || 'LoyaltyHub key is set, but a live quote was not returned yet. Open Prices is filling gaps.'
                : 'Add EXPO_PUBLIC_LOYALTYHUB_KEY in Meals/.env for Shoprite and Checkers shelf prices. Until then, products come from Open Food Facts and prices stay estimated unless Open Prices has a receipt.'}
            </Text>

            <View style={styles.chips}>
              {CADENCES.map((item) => {
                const on = item.id === cadence;
                return (
                  <Pressable key={item.id} onPress={() => setCadence(item.id)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{item.label}</Text>
                    <Text style={[styles.chipHint, on && styles.chipHintOn]}>{item.hint}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.storeHeading}>Shop at</Text>
            <View style={styles.storeChips}>
              {STORE_FILTERS.map((item) => {
                const on = item.id === storeId;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => onStoreChange?.(item.id)}
                    style={[styles.storeChip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.costRow}>
              <Text style={styles.costLabel}>{cadenceMeta?.hint} total</Text>
              <Text style={styles.cost}>{formatRand(estimated)}</Text>
            </View>

            <View style={styles.search}>
              <Ionicons name="search" size={16} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search maize meal, Koo, milk…"
                placeholderTextColor={colors.faint}
                style={styles.searchInput}
              />
            </View>

            <Text style={styles.heading}>Specials</Text>
            {loadingSpecials ? (
              <View style={styles.inlineLoad}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.muted}>Checking live specials…</Text>
              </View>
            ) : visibleSpecials.length ? (
              visibleSpecials.slice(0, 8).map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.special}
                  onPress={() =>
                    onAdd({
                      ...item,
                      checked: true,
                      needed: true,
                    })
                  }
                >
                  <View style={styles.specialBadge}>
                    <Text style={styles.specialBadgeText}>Special</Text>
                  </View>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      {formatRand(item.price)}
                      {item.regularPrice ? ` · was ${formatRand(item.regularPrice)}` : ''}
                      {item.store ? ` · get it at ${item.store}` : ''}
                      {item.city ? `, ${item.city}` : ''}
                      {item.date ? ` · ${item.date}` : ''}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.muted}>
                  {hasLoyaltyHubKey()
                  ? storeId !== 'cheapest'
                    ? `No ${shopLabel} specials on this week’s staples yet. Search a product or try Cheapest mix.`
                    : 'No specials on this week’s staples yet. Search a product to compare Shoprite, Checkers and Pick n Pay.'
                  : 'No live specials yet. Add EXPO_PUBLIC_LOYALTYHUB_KEY in Meals/.env for Shoprite and Checkers shelf prices.'}
              </Text>
            )}

            <Text style={styles.heading}>
              {query.trim() ? `Results · ${filtered.length + searchHits.length}` : `${scaled.length} items`}
            </Text>

            {filtered.map((item) => (
              <View key={item.id} style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => {
                    if (items.some((row) => row.id === item.id)) onToggle(item.id);
                    else onAdd({ ...item, checked: true, needed: true });
                  }}
                >
                  <View style={[styles.check, item.checked && styles.checkOn]}>
                    {item.checked ? <Ionicons name="checkmark" size={13} color={colors.white} /> : null}
                  </View>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>
                      {item.name}
                      {item.qty > 1 ? ` × ${item.qty}` : ''}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {item.brand ? `${item.brand} · ` : ''}
                      {priceLine(item)}
                      {item.qtyLabel ? ` · ${item.qtyLabel}` : ''}
                      {item.extra ? ' · extra' : ''}
                    </Text>
                  </View>
                </Pressable>
                {item.extra && onRemove ? (
                  <Pressable
                    onPress={() => onRemove(item.id)}
                    hitSlop={8}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
            ))}

            {searching ? (
              <View style={styles.inlineLoad}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.muted}>
                  {hasLoyaltyHubKey() ? 'Searching LoyaltyHub shelves…' : 'Searching Open Food Facts…'}
                </Text>
              </View>
            ) : null}

            {searchHits.map((item) => {
              const priced = applyStore(item, storeId);
              return (
                <Pressable key={item.id} style={styles.row} onPress={() => onAdd({ ...item, checked: true, needed: true })}>
                  <View style={styles.check}>
                    <Ionicons name="add" size={13} color={colors.primary} />
                  </View>
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>
                      {item.brand ? `${item.brand} · ` : ''}
                      {priced.price ? priceLine({ ...priced, linePrice: priced.price }) : 'Add to list · price on shelf'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}

            {query.trim() && !filtered.length && !searchHits.length && !searching ? (
              <Text style={styles.muted}>Nothing matched. Try another name, or add it as a custom item.</Text>
            ) : null}

            <Pressable style={styles.outlineBtn} onPress={() => setAddOpen(true)}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.outlineText}>Add custom item</Text>
            </Pressable>
            <Pressable style={styles.fillBtn} onPress={savePdf} disabled={saving}>
              <Ionicons name="download-outline" size={18} color={colors.white} />
              <Text style={styles.fillText}>{saving ? 'Preparing PDF…' : 'Download PDF'}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={addOpen} onRequestClose={() => setAddOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add custom item</Text>
            <TextInput placeholder="Item name" placeholderTextColor={colors.faint} value={name} onChangeText={setName} style={styles.input} />
            <TextInput
              placeholder="Price in R"
              placeholderTextColor={colors.faint}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Pressable style={styles.fillBtn} onPress={addItem}>
              <Text style={styles.fillText}>Add to list</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    paddingBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.card,
    padding: 16,
    backgroundColor: colors.white,
    gap: 8,
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  cardSub: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  cardDownload: {
    padding: 4,
  },
  screen: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: colors.muted,
  },
  sourceNote: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  storeHeading: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  storeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  storeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.prepBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.prepBg,
    paddingVertical: 8,
    alignItems: 'center',
  },
  chipOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  chipLabelOn: {
    color: colors.white,
  },
  chipHint: {
    marginTop: 2,
    fontSize: 10,
    color: colors.muted,
  },
  chipHintOn: {
    color: 'rgba(255,255,255,0.85)',
  },
  costRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  costLabel: {
    fontSize: 13,
    color: colors.muted,
  },
  cost: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  search: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: colors.prepBg,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
  },
  heading: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  muted: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  inlineLoad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  special: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  specialBadge: {
    marginTop: 2,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  specialBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  removeBtn: {
    paddingTop: 2,
    paddingHorizontal: 4,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: radius.checkbox,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkOn: {
    backgroundColor: colors.primary,
  },
  itemCopy: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  itemPrice: {
    marginTop: 2,
    fontSize: 13,
    color: colors.muted,
  },
  outlineBtn: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 999,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  outlineText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  fillBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 999,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fillText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
  },
});
