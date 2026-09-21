import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppHeader from '../components/AppHeader';
import BudgetPicker from '../components/BudgetPicker';
import CustomDish from '../components/CustomDish';
import DaySelector from '../components/DaySelector';
import GoalPicker from '../components/GoalPicker';
import GroceryList from '../components/GroceryList';
import MealCard from '../components/MealCard';
import MealDetail from '../components/MealDetail';
import { colors as mealColors } from '../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
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
import { hasLoyaltyHubKey } from '../lib/loyaltyHub';
import { loadSavedPlan, saveSavedPlan } from '../lib/persist';
import { shareMealToCommunity } from '../lib/shareToCommunity';
import { fetchSaStaples, fallbackSaStaples } from '../lib/saFoodApi';
import { applyStoreList, STORE_FILTERS, storeLabel } from '../lib/stores';

const CADENCE_IDS = ['daily', 'weekly', 'monthly'];

export default function MealPlannerScreen({ onOpenProfile }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { profile, updateFields } = useApp();
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
        if (
          dietHasFlags(saved.dietFilters) &&
          !dietHasFlags(profile?.dietFilters)
        ) {
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchSaStaples();
        if (alive) setCatalog(data);
      } catch {
        if (alive) {
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

  const day = DAYS.find((item) => item.id === selectedDay) || DAYS[0];
  const meals = mealsByDay[selectedDay] || [];
  const priced = useMemo(() => applyStoreList(groceries, storeId), [groceries, storeId]);
  const basketTotal = priced
    .filter((item) => item.needed !== false)
    .reduce((sum, item) => sum + Number(item.price || 0), 0);
  const overBudget = basketTotal > budget;

  useEffect(() => {
    if (!hydrated) return;
    const remaining = remainingAfterGrocery(budget, basketTotal);
    if (profile.weeklyFoodBudget === budget && profile.foodBudgetRemaining === remaining) return;
    updateFields({ weeklyFoodBudget: budget, foodBudgetRemaining: remaining });
  }, [hydrated, budget, basketTotal]);

  const swapMeal = (meal) => {
    const next = nextSlotMeal(budget, meal.slot, meal.recipeId, dietFilters);
    if (!next) {
      Alert.alert(
        'No other meal',
        'This slot only has one option on the current budget and diet. Raise the budget or turn a filter off.'
      );
      return;
    }
    const dayId = meal.dayId || selectedDay;
    const key = `${dayId}:${meal.slot}`;
    const planned = plan?.mealsByDay?.[dayId]?.find((item) => item.slot === meal.slot);
    setCustomByKey((current) => {
      const copy = { ...current };
      delete copy[key];
      return copy;
    });
    setSwapByKey((current) => {
      if (planned && next.id === planned.recipeId) {
        const copy = { ...current };
        delete copy[key];
        return copy;
      }
      return { ...current, [key]: next.id };
    });
    setSelectedMeal(null);
  };

  const sourceLabel = plan
    ? [
        plan.source === 'openfoodfacts'
          ? `SA foods from Open Food Facts · ${plan.liveCount} products`
          : 'SA staple meals · offline list',
        plan.priceSource === 'loyaltyhub'
          ? `Live shelf prices from LoyaltyHub · ${plan.loyaltyCount} products`
          : plan.priceCount
            ? `${plan.priceCount} live ZAR prices from Open Prices`
            : hasLoyaltyHubKey()
              ? 'LoyaltyHub key set · waiting for shelf quotes'
              : 'Add EXPO_PUBLIC_LOYALTYHUB_KEY for Shoprite/Checkers prices',
      ].join(' · ')
    : '';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.text }]}>Meal Planner</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>South African meals built around your grocery budget.</Text>

        <BudgetPicker
          value={budget}
          onChange={setBudget}
          items={weekChips}
        />
        <GoalPicker value={goal} onChange={setGoal} />
        <Text style={[styles.source, { color: colors.muted }]}>{sourceLabel}</Text>
        {plan ? (
          <Text style={[styles.basket, { color: mealColors.primary }]}>
            {storeLabel(storeId)} basket {formatRand(basketTotal)} of {formatRand(budget)}
            {overBudget ? ' · over budget' : ''}
          </Text>
        ) : null}

        <DaySelector days={DAYS} selectedId={selectedDay} onSelect={setSelectedDay} />

        <Text style={[styles.section, { color: colors.text }]}>{`${day.name}'s Meals`}</Text>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={mealColors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Fetching SA foods and live shelf prices…</Text>
          </View>
        ) : (
          meals.map((meal) => (
            <MealCard
              key={`${meal.id}-${meal.slot}`}
              meal={meal}
              onPress={() => {
                if (meal.custom) setOwnFor({ ...meal, dayId: selectedDay });
                else setSelectedMeal(meal);
              }}
              onSwap={swapMeal}
              onCookOwn={(item) => {
                setSelectedMeal(null);
                setOwnFor({ ...item, dayId: item.dayId || selectedDay });
              }}
            />
          ))
        )}

        <GroceryList
          items={groceries}
          products={catalog?.products}
          liveSpecials={catalog?.specials}
          priceSource={catalog?.priceSource}
          loyaltyError={catalog?.loyaltyError}
          storeId={storeId}
          onStoreChange={setStoreId}
          cadence={cadence}
          onCadenceChange={setCadence}
          onToggle={(id) =>
            setGroceries((current) => {
              if (current.some((item) => item.id === id)) {
                return current.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item));
              }
              const extra = catalog?.products?.[id];
              if (!extra) return current;
              return [...current, { ...groceryRow(id, extra), extra: true }];
            })
          }
          onAdd={(item) =>
            setGroceries((current) =>
              current.some((row) => row.id === item.id)
                ? current
                : [...current, { ...item, extra: true, checked: true, needed: true }]
            )
          }
          onRemove={(id) =>
            setGroceries((current) => current.filter((item) => !(item.id === id && item.extra)))
          }
        />
      </ScrollView>

      <MealDetail
        meal={selectedMeal}
        products={catalog?.products}
        goal={goal}
        onChangeGoal={setGoal}
        onSwap={swapMeal}
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
          setOwnFor({ ...item, dayId: item.dayId || selectedDay });
        }}
        onClose={() => setSelectedMeal(null)}
      />

      <CustomDish
        visible={Boolean(ownFor)}
        context={ownFor}
        products={catalog?.products}
        goal={goal}
        onChangeGoal={setGoal}
        onSave={(customMeal) => {
          const key = `${customMeal.dayId}:${customMeal.slot}`;
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
    backgroundColor: mealColors.white,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: mealColors.text,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: mealColors.muted,
  },
  source: {
    marginTop: 10,
    fontSize: 12,
    color: mealColors.muted,
  },
  basket: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: mealColors.primary,
  },
  section: {
    marginTop: 22,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '800',
    color: mealColors.text,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: mealColors.muted,
  },
});
