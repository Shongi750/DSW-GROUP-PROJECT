/**
 * MealPlannerScreen — Meals tab (Today · Plan · Shop).
 *
 * Flow for defense:
 * 1. Load saved plan from device storage + SA food catalog (Open Food Facts / offline staples).
 * 2. buildWeekPlan picks recipes for the weekly budget and diet filters.
 * 3. overlayWeekMeals applies student swaps and custom “cook your own” plates.
 * 4. Groceries auto-build from the visible week; Shop tab prices them by store.
 * 5. Today tab logs eaten meals (local) and can share a plate to Community.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import BudgetPicker from '../components/BudgetPicker';
import CustomDish from '../components/CustomDish';
import DaySelector from '../components/DaySelector';
import GoalPicker from '../components/GoalPicker';
import GroceryList from '../components/GroceryList';
import MealCard from '../components/MealCard';
import MealDetail from '../components/MealDetail';
import NutritionHero from '../components/NutritionHero';
import { StartCard } from '../../../components/StartCard';
import InspoBackground from '../../../components/InspoBackground';
import { colors as mealColors } from '../constants/theme';
import { useTheme, spacing, radius, display } from '../../../context/ThemeContext';
import { PHOTO_GLASS } from '../../../components/PhotoShell';
import { useApp } from '../../../context/AppContext';
import { GOALS } from '../data/goals';
import { DAYS, formatRand, todayDayId } from '../data/planner';
import { remainingAfterGrocery, weekPlanOptions, weeklyForFunding } from '../lib/budget';
import { dietHasFlags, mergeDietFilters } from '../lib/diet';
import {
  buildWeekPlan,
  groceriesFromMeals,
  groceryRow,
  mergeGroceries,
  nextSlotMeal,
  overlayWeekMeals,
} from '../lib/buildWeekPlan';
import { loadSavedPlan, saveSavedPlan } from '../lib/persist';
import { shareMealToCommunity } from '../lib/shareToCommunity';
import { fetchSaStaples, fallbackSaStaples } from '../lib/saFoodApi';
import { applyStoreList, STORE_FILTERS, storeLabel } from '../lib/stores';
import { loadEatenToday, logEatenMeal } from '../lib/eaten';
import { dayMacroPlan, mealProtein, targetsForGoal } from '../lib/nutritionTargets';
import { scaleMeal } from '../lib/portions';
import { SkeletonCard } from '../../../components/Skeleton';
import DownloadButton from '../../../components/DownloadButton';
import { useDownload } from '../../../lib/downloads/useDownload';
import { getDownload } from '../../../lib/downloads/downloadsStore';
import { downloadedOnLabel, pickOfflineSource } from '../../../lib/downloads/downloadsCore';
import { isOnline } from '../../../lib/autoSync';
import { downloadMealPlan, offlineCatalog, planRefId } from '../lib/mealDownloads';

const CADENCE_IDS = ['daily', 'weekly', 'monthly'];
const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'plan', label: 'Plan' },
  { id: 'shop', label: 'Shop' },
];

/** Unique id for “I ate this” — one row per day + meal slot + recipe. */
function mealLogId(meal, dayId) {
  return `${dayId}-${meal.slot}-${meal.recipeId || meal.id}`;
}

/** Key for swap/custom overrides in state (e.g. mon:breakfast). */
function slotKey(dayId, slot) {
  return `${dayId}:${slot}`;
}

/** Human-readable line under Plan tab — where meals and prices come from. */
function buildSourceLabel(plan) {
  if (!plan) return '';
  const foods =
    plan.source === 'openfoodfacts'
      ? `SA campus foods · ${plan.liveCount} products`
      : 'SA staple meals';
  const prices =
    plan.priceSource === 'loyaltyhub' || plan.priceCount
      ? 'Live shelf prices where available'
      : 'Estimated prices until live shelf quotes load';
  return `${foods} · ${prices}`;
}

export default function MealPlannerScreen({ onOpenProfile, openDownload, openAt }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, profile, updateFields } = useApp();
  const [tab, setTab] = useState('today');
  const [selectedDay, setSelectedDay] = useState(todayDayId);
  const [budget, setBudget] = useState(() => weeklyForFunding(profile?.foodBudgetAmount));
  const weekChips = useMemo(
    () => weekPlanOptions(profile?.foodBudgetAmount),
    [profile?.foodBudgetAmount]
  );
  const [goal, setGoal] = useState('bulk');
  const dietFilters = useMemo(
    () => mergeDietFilters(profile?.dietFilters),
    [profile?.dietFilters]
  );
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [ownFor, setOwnFor] = useState(null);
  const [customByKey, setCustomByKey] = useState({});
  const [swapByKey, setSwapByKey] = useState({});
  const [storeId, setStoreId] = useState('cheapest');
  const [cadence, setCadence] = useState('weekly');
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [groceries, setGroceries] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [eaten, setEaten] = useState({ items: [], kcal: 0, protein: 0, carbs: 0 });
  // Downloads: a downloaded plan / grocery list shown instead of the live one (read from Profile → Downloads).
  const [viewing, setViewing] = useState(null); // { kind, entry, data }
  const [viewGroceries, setViewGroceries] = useState([]);
  const [recipeView, setRecipeView] = useState(null); // downloaded recipe opened from Downloads
  const [catalogNote, setCatalogNote] = useState('');

  const uid = user?.id || profile?.userId;

  // --- Reload what the student already ate today (local storage) ---
  const reloadEaten = useCallback(() => {
    loadEatenToday(uid).then(setEaten);
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      reloadEaten();
    }, [reloadEaten]),
  );

  // --- Restore last session: budget, goal, swaps, grocery list ---
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadSavedPlan();
      if (!alive) return;
      const allowedBudgets = weekPlanOptions(profile?.foodBudgetAmount);
      if (saved) {
        if (allowedBudgets.some((item) => item.id === saved.budget)) setBudget(saved.budget);
        else setBudget(weeklyForFunding(profile?.foodBudgetAmount));
        if (GOALS.some((item) => item.id === saved.goal)) setGoal(saved.goal);
        if (dietHasFlags(saved.dietFilters) && !dietHasFlags(profile?.dietFilters)) {
          updateFields?.({ dietFilters: mergeDietFilters(saved.dietFilters) });
        }
        if (DAYS.some((item) => item.id === saved.selectedDay)) setSelectedDay(saved.selectedDay);
        else setSelectedDay(todayDayId());
        if (saved.customByKey && typeof saved.customByKey === 'object') setCustomByKey(saved.customByKey);
        if (saved.swapByKey && typeof saved.swapByKey === 'object') setSwapByKey(saved.swapByKey);
        if (STORE_FILTERS.some((item) => item.id === saved.storeId)) setStoreId(saved.storeId);
        if (CADENCE_IDS.includes(saved.cadence)) setCadence(saved.cadence);
        if (Array.isArray(saved.groceries)) setGroceries(saved.groceries);
      } else if (profile?.foodBudgetAmount) {
        setBudget(weeklyForFunding(profile.foodBudgetAmount));
      }
      setHydrated(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const allowed = weekPlanOptions(profile?.foodBudgetAmount);
    if (!allowed.some((item) => item.id === budget)) {
      setBudget(weeklyForFunding(profile?.foodBudgetAmount));
      setSwapByKey({});
    }
  }, [profile?.foodBudgetAmount]);

  // --- SA product catalog (network with offline fallback) ---
  useEffect(() => {
    let alive = true;
    (async () => {
      // Offline-first: no connection → skip the fetch and use the downloaded plan's foods/prices.
      let live = null;
      if (isOnline()) {
        try {
          live = await fetchSaStaples();
        } catch {
          live = null;
        }
      }
      const saved = live && isOnline() ? null : await offlineCatalog();
      const choice = pickOfflineSource({ online: isOnline(), liveOk: Boolean(live), hasDownload: Boolean(saved) });
      try {
        if (!alive) return;
        if (choice === 'live') setCatalog(live);
        else if (choice === 'download') {
          setCatalog(saved.catalog);
          const why = isOnline() ? 'Food catalog unreachable' : 'Offline';
          setCatalogNote(`${why} · foods and prices from your download (${downloadedOnLabel(saved.savedAt).toLowerCase()})`);
        } else {
          setCatalog(fallbackSaStaples());
          Alert.alert('Using offline SA staples', 'Could not reach Open Food Facts. Meals still use South African foods.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const plan = useMemo(
    () => (catalog ? buildWeekPlan(budget, catalog, dietFilters) : null),
    [budget, catalog, dietFilters]
  );

  const mealsByDay = useMemo(() => {
    if (!plan) return {};
    return overlayWeekMeals(plan, {
      customByKey,
      swapByKey,
      products: catalog?.products || {},
      filters: dietFilters,
    });
  }, [plan, customByKey, swapByKey, catalog, dietFilters]);

  // Open an item from Profile → Downloads in this screen.
  useEffect(() => {
    if (!openDownload) return undefined;
    let alive = true;
    const [kind, ...rest] = String(openDownload).split(':');
    getDownload(kind, rest.join(':')).then((saved) => {
      if (!alive || !saved) return;
      if (kind === 'recipe') {
        setRecipeView(saved);
        setSelectedMeal(saved.data.meal);
        return;
      }
      setViewing({ kind, entry: saved.entry, data: saved.data });
      setViewGroceries(saved.data.groceries || saved.data.items || []);
      setTab(kind === 'grocery' ? 'shop' : 'plan');
      if (kind === 'mealPlan') setSelectedDay(todayDayId());
    });
    return () => {
      alive = false;
    };
  }, [openDownload, openAt]);

  useEffect(() => {
    if (!hydrated || !plan || !catalog) return;
    const derived = groceriesFromMeals(mealsByDay, catalog.products);
    setGroceries((current) => mergeGroceries(derived, current));
  }, [hydrated, plan, catalog, mealsByDay]);

  useEffect(() => {
    if (!hydrated) return undefined;
    const timer = setTimeout(() => {
      saveSavedPlan({
        budget,
        goal,
        dietFilters,
        selectedDay,
        customByKey,
        swapByKey,
        storeId,
        cadence,
        groceries,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [hydrated, budget, goal, dietFilters, selectedDay, customByKey, swapByKey, storeId, cadence, groceries]);

  // What's on screen: the live plan, or the downloaded copy being viewed.
  const viewData = viewing ? viewing.data : null;
  const shownMealsByDay = viewing?.kind === 'mealPlan' ? viewData.mealsByDay || {} : mealsByDay;
  const shownGroceries = viewing ? viewGroceries : groceries;
  const setShownGroceries = viewing ? setViewGroceries : setGroceries;
  const shownStoreId = viewData?.storeId || storeId;
  const shownCadence = viewData?.cadence || cadence;
  const shownBudget = viewing?.kind === 'mealPlan' ? viewData.budget : budget;
  const shownProducts = viewData
    ? { ...(catalog?.products || {}), ...(viewData.catalog?.products || viewData.products || {}) }
    : catalog?.products;
  const planDl = useDownload('mealPlan', planRefId(budget, goal));

  const todayId = todayDayId();
  const activeDayId = tab === 'today' ? todayId : selectedDay;
  const day = DAYS.find((item) => item.id === activeDayId) || DAYS[0];
  const meals = shownMealsByDay[activeDayId] || [];
  const nextMeal = meals.find((m) => !eaten.items.some((item) => item.id === mealLogId(m, activeDayId))) || meals[0] || null;
  const priced = useMemo(() => applyStoreList(shownGroceries, shownStoreId), [shownGroceries, shownStoreId]);
  const basketTotal = priced
    .filter((item) => item.needed !== false)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);
  const overBudget = basketTotal > shownBudget;
  const remaining = Math.max(0, shownBudget - basketTotal);
  const targets = targetsForGoal(goal);
  const planned = useMemo(() => dayMacroPlan(mealsByDay[todayId] || [], goal), [mealsByDay, todayId, goal]);
  const eatenIds = useMemo(() => new Set((eaten.items || []).map((item) => item.id)), [eaten.items]);

  useEffect(() => {
    if (!hydrated || viewing) return; // a downloaded copy never changes the live budget
    const left = remainingAfterGrocery(budget, basketTotal);
    if (profile.weeklyFoodBudget === budget && profile.foodBudgetRemaining === left) return;
    updateFields({ weeklyFoodBudget: budget, foodBudgetRemaining: left });
  }, [hydrated, budget, basketTotal, viewing]);

  /** Cycle to another recipe in the same slot; clears a custom plate on that slot. */
  const swapMeal = (meal) => {
    const next = nextSlotMeal(budget, meal.slot, meal.recipeId, dietFilters);
    if (!next) {
      Alert.alert(
        'No other meal',
        'This slot only has one option on the current budget and diet. Raise the budget or turn a filter off.'
      );
      return;
    }
    const dayId = meal.dayId || activeDayId;
    const key = slotKey(dayId, meal.slot);
    const defaultRecipeId = plan?.mealsByDay?.[dayId]?.find((item) => item.slot === meal.slot)?.recipeId;
    setCustomByKey((current) => {
      const copy = { ...current };
      delete copy[key];
      return copy;
    });
    setSwapByKey((current) => {
      if (defaultRecipeId && next.id === defaultRecipeId) {
        const copy = { ...current };
        delete copy[key];
        return copy;
      }
      return { ...current, [key]: next.id };
    });
    setSelectedMeal(null);
  };

  const markEaten = async (meal) => {
    const scaled = meal.recipeId ? scaleMeal(meal.recipeId, goal) : null;
    const next = await logEatenMeal(uid, {
      id: mealLogId(meal, activeDayId),
      title: meal.title,
      kcal: meal.kcal,
      protein: mealProtein(meal, goal),
      carbs: scaled?.carbs || 0,
    });
    setEaten(next);
  };

  const sourceLabel = catalogNote || buildSourceLabel(plan);

  const downloadPlan = () =>
    planDl.run(() =>
      downloadMealPlan({ budget, goal, dietFilters, customByKey, swapByKey, mealsByDay, groceries, storeId, cadence, catalog })
    );

  const renderMealList = (list, dayId) =>
    loading ? (
      <View style={styles.loading}>
        {/* Skeleton plates while SA foods and shelf prices load */}
        <SkeletonCard style={{ marginHorizontal: 0, alignSelf: 'stretch' }} />
        <SkeletonCard style={{ marginHorizontal: 0, alignSelf: 'stretch' }} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Fetching SA foods and live shelf prices…</Text>
      </View>
    ) : (
      list.map((meal) => (
        <MealCard
          key={`${meal.id}-${meal.slot}`}
          meal={meal}
          eaten={eatenIds.has(mealLogId(meal, dayId))}
          onAte={dayId === todayId ? markEaten : undefined}
          onPress={() => {
            if (meal.custom) setOwnFor({ ...meal, dayId });
            else setSelectedMeal(meal);
          }}
          onSwap={viewing ? undefined : swapMeal}
          onCookOwn={
            viewing
              ? undefined
              : (item) => {
                  setSelectedMeal(null);
                  setOwnFor({ ...item, dayId: item.dayId || dayId });
                }
          }
        />
      ))
    );

  return (
    <View style={[styles.screen, { backgroundColor: 'transparent' }]}>
      <InspoBackground plate="meals" />
      <View style={{ paddingTop: insets.top + 6 }}>
        <AppHeader
          onAvatarPress={onOpenProfile}
          onBellPress={() => Alert.alert('Notifications', 'You are all caught up.')}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: '#FFFFFF' }]}>Meals</Text>
        <Text style={[styles.subtitle, { color: '#C9C9C9' }]}>Diary. Plan. Shop — SA campus plates.</Text>

        <View style={[styles.segments, PHOTO_GLASS]}>
          {TABS.map((item) => {
            const on = tab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setTab(item.id)}
                style={[styles.segment, on && { backgroundColor: colors.accent }]}
              >
                <Text style={{ color: on ? '#FFFFFF' : '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {viewing ? (
          <View style={[styles.viewBanner, PHOTO_GLASS]}>
            <Ionicons name="download" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.viewTitle}>Downloaded copy · {viewing.entry.title}</Text>
              <Text style={styles.viewSub}>{downloadedOnLabel(viewing.entry.savedAt)} · read only</Text>
            </View>
            <TouchableOpacity onPress={() => setViewing(null)} hitSlop={8}>
              <Text style={[styles.viewBack, { color: colors.accent }]}>My plan</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {tab === 'today' ? (
          <>
            <NutritionHero
              eatenKcal={eaten.kcal}
              eatenProtein={eaten.protein}
              eatenCarbs={eaten.carbs || 0}
              targetKcal={targets.kcal}
              targetProtein={targets.protein}
              targetCarbs={targets.carbs}
              plannedKcal={planned.kcal}
            />

            {nextMeal && !loading ? (
              <>
                <Text style={[styles.section, { color: '#FFFFFF', marginTop: 16 }]}>Next up</Text>
                <StartCard
                  fullWidth
                  height={200}
                  image={nextMeal.image}
                  title={nextMeal.title}
                  meta={`${nextMeal.slot} · ${nextMeal.kcal} kcal`}
                  badge={nextMeal.slot}
                  onPress={() => {
                    if (nextMeal.custom) setOwnFor({ ...nextMeal, dayId: todayId });
                    else setSelectedMeal(nextMeal);
                  }}
                />
              </>
            ) : null}

            <Text style={[styles.section, { color: '#FFFFFF' }]}>{`Today's meals`}</Text>
            {renderMealList(meals, todayId)}
          </>
        ) : null}

        {tab === 'plan' ? (
          <>
            <BudgetPicker value={budget} onChange={setBudget} items={weekChips} />
            <GoalPicker value={goal} onChange={setGoal} />
            {sourceLabel ? (
              <Text style={[styles.source, { color: '#C9C9C9' }]}>{sourceLabel}</Text>
            ) : null}
            {!viewing && plan ? (
              <DownloadButton dl={planDl} onDownload={downloadPlan} style={{ marginTop: 12 }} />
            ) : null}

            <DaySelector days={DAYS} selectedId={selectedDay} onSelect={setSelectedDay} />
            <Text style={[styles.section, { color: '#FFFFFF' }]}>{`${day.name}'s Meals`}</Text>
            {renderMealList(meals, selectedDay)}
          </>
        ) : null}

        {tab === 'shop' ? (
          <>
            {plan ? (
              <View style={[styles.budgetBanner, { backgroundColor: colors.accent }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.budgetKicker}>{storeLabel(storeId).toUpperCase()} BASKET</Text>
                  <Text style={styles.budgetTitle}>
                    {overBudget ? 'Over budget' : `${formatRand(remaining)} left`}
                  </Text>
                  <Text style={styles.budgetSub}>
                    {formatRand(basketTotal)} of {formatRand(shownBudget)} this week
                  </Text>
                </View>
                <Ionicons name="cart" size={28} color="rgba(10,10,10,0.55)" />
              </View>
            ) : null}

            <GroceryList
              items={shownGroceries}
              products={shownProducts}
              liveSpecials={catalog?.specials}
              priceSource={catalog?.priceSource}
              loyaltyError={catalog?.loyaltyError}
              storeId={shownStoreId}
              onStoreChange={viewing ? undefined : setStoreId}
              cadence={shownCadence}
              onCadenceChange={viewing ? () => {} : setCadence}
              offlineNote={viewing ? `Downloaded copy · ${downloadedOnLabel(viewing.entry.savedAt)}` : ''}
              onToggle={(id) =>
                setShownGroceries((current) => {
                  if (current.some((item) => item.id === id)) {
                    return current.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
                  }
                  const extra = catalog?.products?.[id];
                  if (!extra) return current;
                  return [...current, { ...groceryRow(id, extra), extra: true }];
                })
              }
              onAdd={(item) =>
                setShownGroceries((current) =>
                  current.some((row) => row.id === item.id)
                    ? current
                    : [...current, { ...item, extra: true, checked: true, needed: true }]
                )
              }
              onRemove={(id) =>
                setShownGroceries((current) => current.filter((item) => !(item.id === id && item.extra)))
              }
            />
          </>
        ) : null}
      </ScrollView>

      <MealDetail
        meal={selectedMeal}
        products={recipeView ? { ...(catalog?.products || {}), ...recipeView.data.products } : shownProducts}
        offlineNote={recipeView ? `Downloaded copy · ${downloadedOnLabel(recipeView.entry.savedAt)}` : ''}
        goal={goal}
        onChangeGoal={setGoal}
        onSwap={recipeView || viewing ? undefined : swapMeal}
        onShare={async (item) => {
          try {
            await shareMealToCommunity(item, profile?.name);
            Alert.alert('Shared', 'This plate is on the Community feed with its cook steps and video.');
          } catch (error) {
            Alert.alert('Could not share', error.message);
          }
        }}
        onCookOwn={(item) => {
          setSelectedMeal(null);
          setOwnFor({ ...item, dayId: item.dayId || activeDayId });
        }}
        onClose={() => {
          setSelectedMeal(null);
          setRecipeView(null);
        }}
      />

      <CustomDish
        visible={Boolean(ownFor)}
        context={ownFor}
        products={catalog?.products}
        goal={goal}
        onChangeGoal={setGoal}
        onSave={(customMeal) => {
          const key = slotKey(customMeal.dayId, customMeal.slot);
          setSwapByKey((current) => {
            const copy = { ...current };
            delete copy[key];
            return copy;
          });
          setCustomByKey((current) => ({ ...current, [key]: customMeal }));
          setOwnFor(null);
        }}
        onClose={() => setOwnFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.section,
    paddingTop: spacing.card,
    paddingBottom: 48,
  },
  title: {
    ...display,
    fontSize: 36,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 15,
  },
  segments: {
    flexDirection: 'row',
    borderRadius: radius.image,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  source: {
    marginTop: 14,
    fontSize: 12,
  },
  budgetBanner: {
    borderRadius: radius.card,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  budgetKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: 'rgba(10,10,10,0.65)',
    marginBottom: 4,
  },
  budgetTitle: {
    ...display,
    fontSize: 24,
    letterSpacing: 0.4,
    color: '#0A0A0A',
  },
  budgetSub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(10,10,10,0.72)',
  },
  sourcesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  section: {
    ...display,
    marginTop: 28,
    marginBottom: 14,
    fontSize: 22,
  },
  viewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  viewTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  viewSub: { color: '#C9C9C9', fontSize: 12, marginTop: 2 },
  viewBack: { fontWeight: '800', fontSize: 14 },
  loading: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
});
