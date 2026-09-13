import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { fonts, spacing, radius } from '../../utils/theme';
import { useAppTheme } from '../../context/ThemeContext';
import BottomNav from '../../components/common/BottomNav';
import { lookupFoodsNutrition } from '../../services/foodNutritionApi';
import { exportHtmlPdf, mealPlanHtml } from '../../services/pdfExport';

const HEADER_AVATAR = require('../../../assets/figma/avatar.png');
const MEAL_OATS = require('../../../assets/figma/meal-oats.png');
const MEAL_CHICKEN = require('../../../assets/figma/meal-chicken.png');
const MEAL_PAP = require('../../../assets/figma/meal-pap.png');
const MEAL_BOWL = require('../../../assets/figma/meal-bowl.png');

const MEAL_PHOTOS = {
  bf1: MEAL_OATS,
  bf3: MEAL_PAP,
  l2: MEAL_CHICKEN,
  d2: MEAL_PAP,
};

const GROCERY_DEFAULT = [
  { id: 'g1', name: 'Maize-Meal (2.5kg)', price: 45, checked: true },
  { id: 'g2', name: 'White Rice (2kg)', price: 38, checked: true },
  { id: 'g3', name: 'Chicken Portions', price: 120, checked: false },
  { id: 'g4', name: 'Eggs (18 pack)', price: 52, checked: false },
  { id: 'g5', name: 'Seasonal Veg Mix', price: 45, checked: false },
  { id: 'g6', name: 'Oats (1kg)', price: 40, checked: false },
];

function mealPhoto(meal) {
  return MEAL_PHOTOS[meal?.id] || MEAL_BOWL;
}

function mealTag(type) {
  if (type === 'breakfast') return 'High Carbs';
  if (type === 'lunch') return 'High Protein';
  return 'Balanced';
}

// FR-24: Ingredient alternatives mapping
// When an ingredient is unavailable/expensive, suggest alternatives
const INGREDIENT_ALTERNATIVES = {
  'Chicken breast': {
    alternatives: ['Pilchards (canned)', 'Beans', 'Lentils', 'Eggs (3)'],
    reason: 'Expensive or unavailable',
  },
  'Pilchards (canned)': {
    alternatives: ['Beans', 'Lentils', 'Chicken breast', 'Eggs (2)'],
    reason: 'Out of stock or expensive',
  },
  'Eggs (2)': {
    alternatives: ['Beans', 'Lentils', 'Peanut butter', 'Pilchards (canned)'],
    reason: 'Not available or too pricey',
  },
  'Eggs (3)': {
    alternatives: ['Beans', 'Lentils', 'Peanut butter', 'Pilchards (canned)'],
    reason: 'Not available or too pricey',
  },
  'Rice': {
    alternatives: ['Pap', 'Pasta', 'Potatoes', 'Bread'],
    reason: 'Out of stock',
  },
  'Pap': {
    alternatives: ['Rice', 'Pasta', 'Potatoes', 'Bread'],
    reason: 'Unavailable',
  },
  'Pasta': {
    alternatives: ['Rice', 'Pap', 'Potatoes', 'Bread'],
    reason: 'Not in stock',
  },
  'Beans': {
    alternatives: ['Lentils', 'Chicken breast', 'Pilchards (canned)', 'Peanut butter'],
    reason: 'Sold out',
  },
  'Lentils': {
    alternatives: ['Beans', 'Chicken breast', 'Pilchards (canned)', 'Peanut butter'],
    reason: 'Not available',
  },
  'Maize meal': {
    alternatives: ['Rice', 'Pap', 'Pasta', 'Potatoes'],
    reason: 'Out of stock',
  },
  'Peanut butter': {
    alternatives: ['Beans', 'Lentils', 'Eggs (2)', 'Pilchards (canned)'],
    reason: 'Unavailable',
  },
};

// South African student-friendly foods database
const MEAL_DATABASE = {
  breakfasts: [
    {
      id: 'bf1',
      name: 'Oats with Peanut Butter & Banana',
      ingredients: ['Oats', 'Peanut butter', 'Banana'],
      calories: 450,
      cost: 45,
      time: 10,
      icon: 'ðŸ¥£',
      keyIngredient: 'Peanut butter',
    },
    {
      id: 'bf2',
      name: 'Eggs & Toast',
      ingredients: ['Eggs (2)', 'Bread (2 slices)', 'Butter'],
      calories: 380,
      cost: 35,
      time: 8,
      icon: 'ðŸ³',
      keyIngredient: 'Eggs (2)',
    },
    {
      id: 'bf3',
      name: 'Pap & Milk',
      ingredients: ['Pap', 'Milk', 'Sugar'],
      calories: 320,
      cost: 30,
      time: 15,
      icon: 'ðŸ²',
      keyIngredient: 'Pap',
    },
    {
      id: 'bf4',
      name: 'Amasi with Muesli',
      ingredients: ['Amasi', 'Muesli', 'Berries'],
      calories: 280,
      cost: 50,
      time: 5,
      icon: 'ðŸ¥›',
      keyIngredient: 'Amasi',
    },
  ],
  lunches: [
    {
      id: 'l1',
      name: 'Rice & Beans',
      ingredients: ['Rice', 'Beans', 'Onion', 'Oil'],
      calories: 520,
      cost: 55,
      time: 25,
      icon: 'ðŸš',
      keyIngredient: 'Rice',
    },
    {
      id: 'l2',
      name: 'Chicken & Vegetable Stir-fry',
      ingredients: ['Chicken breast', 'Mixed veg', 'Rice'],
      calories: 580,
      cost: 85,
      time: 30,
      icon: 'ðŸ—',
      keyIngredient: 'Chicken breast',
    },
    {
      id: 'l3',
      name: 'Lentil & Pumpkin Curry',
      ingredients: ['Lentils', 'Pumpkin', 'Spices', 'Bread'],
      calories: 450,
      cost: 48,
      time: 35,
      icon: 'ðŸ›',
      keyIngredient: 'Lentils',
    },
    {
      id: 'l4',
      name: 'Pilchards & Bread',
      ingredients: ['Pilchards (canned)', 'Bread', 'Tomato'],
      calories: 380,
      cost: 38,
      time: 5,
      icon: 'ðŸ¥«',
      keyIngredient: 'Pilchards (canned)',
    },
    {
      id: 'l5',
      name: 'Pap & Relish',
      ingredients: ['Pap', 'Spinach relish', 'Butter'],
      calories: 350,
      cost: 32,
      time: 20,
      icon: 'ðŸ²',
      keyIngredient: 'Pap',
    },
  ],
  dinners: [
    {
      id: 'd1',
      name: 'Spaghetti & Tomato Sauce',
      ingredients: ['Pasta', 'Tomato sauce', 'Onion', 'Oil'],
      calories: 520,
      cost: 60,
      time: 25,
      icon: 'ðŸ',
      keyIngredient: 'Pasta',
    },
    {
      id: 'd2',
      photo: 'pap',
      name: 'Maize Meal & Chicken',
      ingredients: ['Maize meal', 'Chicken', 'Vegetables'],
      calories: 580,
      cost: 75,
      time: 35,
      icon: 'ðŸŒ½',
      keyIngredient: 'Chicken',
    },
    {
      id: 'd3',
      name: 'Bean Stew with Bread',
      ingredients: ['Beans', 'Carrots', 'Onion', 'Bread'],
      calories: 450,
      cost: 45,
      time: 40,
      icon: 'ðŸ¥˜',
      keyIngredient: 'Beans',
    },
    {
      id: 'd4',
      name: 'Eggs & Fried Potatoes',
      ingredients: ['Eggs (3)', 'Potatoes', 'Onion', 'Oil'],
      calories: 520,
      cost: 50,
      time: 20,
      icon: 'ðŸ¥”',
      keyIngredient: 'Eggs (3)',
    },
  ],
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MealPlanningScreen({ navigation, route }) {
  const { state } = useContext(AuthContext);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const user = state.user;

  const [selectedDay, setSelectedDay] = useState(2);
  const [grocery, setGrocery] = useState(GROCERY_DEFAULT);
  const [mealPlan, setMealPlan] = useState(() => generateInitialPlan());
  const [totalWeeklyCost, setTotalWeeklyCost] = useState(() => calculateTotalCost());
  const [filterBudget, setFilterBudget] = useState(route?.params?.budget || user?.foodBudget || 2500);
  const [unavailableIngredients, setUnavailableIngredients] = useState({});
  const [showAlternativesTip, setShowAlternativesTip] = useState(true);
  const [nutritionMatches, setNutritionMatches] = useState([]);
  const [nutritionLoading, setNutritionLoading] = useState(false);

  function generateInitialPlan() {
    // Use the calculated weekly food budget before choosing meals. This keeps
    // lower-cost options at the front of a student's plan instead of merely
    // warning after expensive choices have already been made.
    const perMealTarget = Number(user?.foodBudget || 2500) / (DAYS.length * 3);
    const chooseAffordable = (meals, index) => {
      const affordable = meals.filter((meal) => meal.cost <= perMealTarget);
      const options = (affordable.length ? affordable : meals).slice().sort((a, b) => a.cost - b.cost);
      return options[index % options.length];
    };
    const plan = {};
    DAYS.forEach((day, index) => {
      plan[day] = {
        breakfast: chooseAffordable(MEAL_DATABASE.breakfasts, index),
        lunch: chooseAffordable(MEAL_DATABASE.lunches, index),
        dinner: chooseAffordable(MEAL_DATABASE.dinners, index),
      };
    });
    return plan;
  }

  function calculateTotalCost() {
    let total = 0;
    Object.values(mealPlan).forEach((day) => {
      total += day.breakfast.cost + day.lunch.cost + day.dinner.cost;
    });
    return total;
  }

  // FR-24: Get meals without unavailable key ingredients
  function getAvailableMeals(mealType) {
    const mealOptions = {
      breakfast: MEAL_DATABASE.breakfasts,
      lunch: MEAL_DATABASE.lunches,
      dinner: MEAL_DATABASE.dinners,
    };

    return mealOptions[mealType].map((meal) => ({
      meal,
      hasUnavailableIngredient: meal.keyIngredient && unavailableIngredients[meal.keyIngredient],
    }));
  }

  // FR-24: Find alternative meals when key ingredient unavailable
  function suggestAlternativesMeal(mealType) {
    const meals = getAvailableMeals(mealType);
    const availableMeals = meals.filter((m) => !m.hasUnavailableIngredient);

    if (availableMeals.length > 0) {
      return availableMeals.map((m) => m.meal);
    }
    return meals.map((m) => m.meal); // Fall back to all if all have unavailable
  }

  function toggleIngredientAvailability(ingredient) {
    setUnavailableIngredients((prev) => {
      const updated = { ...prev };
      if (updated[ingredient]) {
        delete updated[ingredient];
      } else {
        updated[ingredient] = true;
      }
      return updated;
    });
  }

  const handleChangeMeal = (mealType) => {
    const availableMeals = suggestAlternativesMeal(mealType);
    const allMeals = {
      breakfast: MEAL_DATABASE.breakfasts,
      lunch: MEAL_DATABASE.lunches,
      dinner: MEAL_DATABASE.dinners,
    }[mealType];

    Alert.alert(
      `Choose ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
      'Select a meal option',
      [
        ...allMeals.map((meal) => {
          const isAvailable = availableMeals.find((m) => m.id === meal.id);
          const unavailableKey = meal.keyIngredient && unavailableIngredients[meal.keyIngredient];

          return {
            text: `${meal.name} (R${meal.cost})${unavailableKey ? ' âŒ' : ' âœ“'}`,
            onPress: () => {
              const newPlan = { ...mealPlan };
              newPlan[DAYS[selectedDay]][mealType] = meal;
              setMealPlan(newPlan);
              setTotalWeeklyCost(calculateTotalCost());
            },
          };
        }),
        { text: 'Cancel', onPress: () => {} },
      ]
    );
  };

  const handleViewShoppingList = () => {
    const allIngredients = new Set();
    Object.values(mealPlan).forEach((day) => {
      day.breakfast.ingredients.forEach((ing) => allIngredients.add(ing));
      day.lunch.ingredients.forEach((ing) => allIngredients.add(ing));
      day.dinner.ingredients.forEach((ing) => allIngredients.add(ing));
    });

    navigation.navigate('ShoppingList', {
      ingredients: Array.from(allIngredients),
      totalCost: totalWeeklyCost,
      budget: filterBudget,
    });
  };

  const currentDayMeals = mealPlan[DAYS[selectedDay]];
  const dailyCost = currentDayMeals
    ? currentDayMeals.breakfast.cost + currentDayMeals.lunch.cost + currentDayMeals.dinner.cost
    : 0;
  const dailyCalories = currentDayMeals
    ? currentDayMeals.breakfast.calories + currentDayMeals.lunch.calories + currentDayMeals.dinner.calories
    : 0;

  useEffect(() => {
    let cancelled = false;

    async function loadNutrition() {
      if (!currentDayMeals) return;

      const ingredients = [
        ...currentDayMeals.breakfast.ingredients,
        ...currentDayMeals.lunch.ingredients,
        ...currentDayMeals.dinner.ingredients,
      ];

      setNutritionLoading(true);
      const matches = await lookupFoodsNutrition(ingredients);
      if (!cancelled) {
        setNutritionMatches(matches.filter((match) => match.nutrition));
        setNutritionLoading(false);
      }
    }

    loadNutrition();
    return () => {
      cancelled = true;
    };
  }, [selectedDay, currentDayMeals]);

  const budgetWarning = totalWeeklyCost > filterBudget;

  const dayName = DAYS[selectedDay] === 'Wed' ? 'Wednesday' : DAYS[selectedDay] === 'Thu' ? 'Thursday' : DAYS[selectedDay] === 'Tue' ? 'Tuesday' : DAYS[selectedDay] === 'Sat' ? 'Saturday' : DAYS[selectedDay] === 'Sun' ? 'Sunday' : DAYS[selectedDay] === 'Fri' ? 'Friday' : 'Monday';
  const groceryTotal = grocery.reduce((sum, item) => sum + item.price, 0);
  const liveWeeklyCost = DAYS.reduce((sum, day) => {
    const meals = mealPlan[day];
    return sum + meals.breakfast.cost + meals.lunch.cost + meals.dinner.cost;
  }, 0);

  const saveMealPlanPdf = async () => {
    try {
      await exportHtmlPdf(
        'UFitness meal plan',
        mealPlanHtml({
          studentName: user?.name,
          budget: filterBudget,
          weeklyCost: liveWeeklyCost,
          days: DAYS.map((label) => ({ label, ...mealPlan[label] })),
          grocery,
        })
      );
    } catch (error) {
      const message = error.message || 'Could not create the PDF.';
      if (Platform.OS === 'web') window.alert(message);
      else Alert.alert('PDF download failed', message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.figmaHeader}>
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => navigation.navigate('Profile')}
          accessibilityLabel="Open profile"
        >
          <Image source={HEADER_AVATAR} style={styles.headerAvatar} />
          <Text style={styles.brand}>UFitness</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Open notifications">
          <Text style={styles.bell}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: 92 }}
        showsVerticalScrollIndicator={false}
      >
        {/* FR-24 Smart Alternatives Tip */}
        {showAlternativesTip && Object.keys(unavailableIngredients).length > 0 && (
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipTitle}>ðŸ’¡ Smart Alternatives Active</Text>
              <TouchableOpacity onPress={() => setShowAlternativesTip(false)}>
                <Text style={styles.tipClose}>âœ•</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.tipText}>
              {Object.keys(unavailableIngredients).length} ingredient(s) marked unavailable. Tap meal cards to see alternative options!
            </Text>
          </View>
        )}

        {/* Budget Info Card */}
        <View style={[styles.infoCard, budgetWarning && styles.warningCard]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weekly Budget</Text>
            <Text style={styles.infoBudget}>R{filterBudget}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Cost</Text>
            <Text style={[styles.infoCost, budgetWarning && styles.costOverBudget]}>
              R{totalWeeklyCost}
            </Text>
          </View>
          {budgetWarning && (
            <Text style={styles.warningText}>
              âš ï¸ Over budget by R{totalWeeklyCost - filterBudget}
            </Text>
          )}
        </View>

        {/* FR-24: Ingredient Availability Manager */}
        {Object.keys(INGREDIENT_ALTERNATIVES).length > 0 && (
          <View style={styles.availabilityCard}>
            <Text style={styles.availabilityTitle}>Mark Unavailable Items</Text>
            <Text style={styles.availabilityDesc}>
              Mark items as unavailable to see alternative meal suggestions
            </Text>
            <View style={styles.ingredientList}>
              {Object.keys(INGREDIENT_ALTERNATIVES).map((ingredient) => (
                <TouchableOpacity
                  key={ingredient}
                  style={[
                    styles.ingredientItem,
                    unavailableIngredients[ingredient] && styles.ingredientItemUnavailable,
                  ]}
                  onPress={() => toggleIngredientAvailability(ingredient)}
                >
                  <Text style={styles.ingredientCheckbox}>
                    {unavailableIngredients[ingredient] ? 'âœ“' : 'â˜'}
                  </Text>
                  <Text
                    style={[
                      styles.ingredientName,
                      unavailableIngredients[ingredient] && styles.ingredientNameUnavailable,
                    ]}
                  >
                    {ingredient}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.daySelector}>
          {DAYS.map((item, index) => (
            <TouchableOpacity
              key={item}
              style={[styles.dayButton, selectedDay === index && styles.dayButtonActive]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[styles.dayButtonText, selectedDay === index && styles.dayButtonTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.dayHeading}>{dayName}’s Meals</Text>
        <Text style={styles.daySub}>
          {dailyCalories} kcal · R{dailyCost} · tap a meal to swap
        </Text>

        {/* Meals for the day */}
        {currentDayMeals && (
          <>
            <MealCard
              styles={styles}
              theme={theme}
              meal={currentDayMeals.breakfast}
              type="breakfast"
              onPress={() => handleChangeMeal('breakfast')}
              isKeyIngredientUnavailable={
                currentDayMeals.breakfast.keyIngredient &&
                unavailableIngredients[currentDayMeals.breakfast.keyIngredient]
              }
              keyIngredient={currentDayMeals.breakfast.keyIngredient}
              alternatives={
                INGREDIENT_ALTERNATIVES[currentDayMeals.breakfast.keyIngredient]
              }
            />

            <MealCard
              styles={styles}
              theme={theme}
              meal={currentDayMeals.lunch}
              type="lunch"
              onPress={() => handleChangeMeal('lunch')}
              isKeyIngredientUnavailable={
                currentDayMeals.lunch.keyIngredient &&
                unavailableIngredients[currentDayMeals.lunch.keyIngredient]
              }
              keyIngredient={currentDayMeals.lunch.keyIngredient}
              alternatives={
                INGREDIENT_ALTERNATIVES[currentDayMeals.lunch.keyIngredient]
              }
            />

            <MealCard
              styles={styles}
              theme={theme}
              meal={currentDayMeals.dinner}
              type="dinner"
              onPress={() => handleChangeMeal('dinner')}
              isKeyIngredientUnavailable={
                currentDayMeals.dinner.keyIngredient &&
                unavailableIngredients[currentDayMeals.dinner.keyIngredient]
              }
              keyIngredient={currentDayMeals.dinner.keyIngredient}
              alternatives={
                INGREDIENT_ALTERNATIVES[currentDayMeals.dinner.keyIngredient]
              }
            />
          </>
        )}

        {/* Budget Adjustment */}
        <View style={styles.budgetAdjustContainer}>
          <Text style={[styles.sectionLabel, { color: theme.text }]}>
            ADJUST BUDGET
          </Text>
          <View style={styles.budgetOptions}>
            {[1500, 2000, 2500, 3000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.budgetOption,
                  filterBudget === amount && styles.budgetOptionActive,
                ]}
                onPress={() => setFilterBudget(amount)}
              >
                <Text
                  style={[
                    styles.budgetOptionText,
                    filterBudget === amount && styles.budgetOptionTextActive,
                  ]}
                >
                  R{amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nutritional Info */}
        <View style={styles.nutritionInfo}>
          <Text style={[styles.nutritionTitle, { color: theme.text }]}>
            Nutritional Benefits
          </Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionIcon}>ðŸ¥¬</Text>
              <Text style={styles.nutritionText}>Vegetables & Greens</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionIcon}>ðŸ—</Text>
              <Text style={styles.nutritionText}>Protein Sources</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionIcon}>ðŸŒ¾</Text>
              <Text style={styles.nutritionText}>Whole Grains</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionIcon}>ðŸ¥š</Text>
              <Text style={styles.nutritionText}>Affordable Proteins</Text>
            </View>
          </View>
          <Text style={styles.apiNutritionTitle}>Open Food Facts lookup</Text>
          <Text style={styles.apiNutritionStatus}>
            {nutritionLoading
              ? 'Checking nutrition data for this day...'
              : nutritionMatches.length > 0
                ? `${nutritionMatches.length} ingredient matches found online`
                : 'Online data unavailable; using the built-in meal data'}
          </Text>
          {nutritionMatches.slice(0, 3).map(({ foodName, nutrition }) => (
            <Text key={foodName} style={styles.apiNutritionItem}>
              {foodName}: {nutrition.calories == null ? 'Nutrition not listed' : `${nutrition.calories} kcal/100g`}
            </Text>
          ))}
        </View>

        <View style={styles.groceryCard}>
          <View style={styles.groceryHead}>
            <Text style={styles.groceryTitle}>Grocery List</Text>
            <Text style={styles.groceryTotal}>R{groceryTotal}</Text>
          </View>
          {grocery.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.groceryRow}
              onPress={() =>
                setGrocery((rows) =>
                  rows.map((row) => (row.id === item.id ? { ...row, checked: !row.checked } : row))
                )
              }
            >
              <View style={[styles.check, item.checked && styles.checkOn]}>
                <Text style={styles.checkMark}>{item.checked ? '✓' : ''}</Text>
              </View>
              <Text style={[styles.groceryName, item.checked && styles.groceryDone]}>{item.name}</Text>
              <Text style={styles.groceryPrice}>R{item.price}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addCustom}
            onPress={() => navigation.navigate('ShoppingList', { ingredients: grocery.map((g) => g.name), totalCost: groceryTotal, budget: filterBudget })}
          >
            <Text style={styles.addCustomText}>+ Add Custom Item</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={saveMealPlanPdf}
            accessibilityRole="button"
          >
            <Text style={styles.primaryActionText}>Save to PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={handleViewShoppingList} accessibilityRole="button">
            <Text style={styles.secondaryActionText}>View shopping list</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <BottomNav navigation={navigation} active="Meals" />
    </View>
  );
}

// FR-24: Enhanced MealCard with alternative suggestions
function MealCard({
  styles,
  theme,
  meal,
  type,
  onPress,
  isKeyIngredientUnavailable,
  alternatives,
}) {
  const typeColor = type === 'lunch' ? theme.teal : theme.primary;

  return (
    <TouchableOpacity
      style={[styles.mealCard, isKeyIngredientUnavailable && styles.mealCardUnavailable]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image source={mealPhoto(meal)} style={styles.mealThumb} />
      <View style={styles.mealCopy}>
        <Text style={[styles.mealType, { color: typeColor }]}>{type.toUpperCase()}</Text>
        <Text style={styles.mealName}>{meal.name}</Text>
        <View style={styles.mealStats}>
          <Text style={styles.stat}>{meal.calories} kcal</Text>
          <View style={styles.tag}>
            <Text style={[styles.tagText, { color: typeColor }]}>{mealTag(type)}</Text>
          </View>
          <Text style={styles.stat}>Prep {meal.time}m</Text>
        </View>
        {isKeyIngredientUnavailable && alternatives ? (
          <Text style={styles.altLine}>Try: {alternatives.alternatives.slice(0, 2).join(', ')}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme) => {
  const colors = {
    primary: theme.primary, primaryLight: theme.primarySoft, secondary: theme.teal, secondaryLight: theme.tealSoft, tealSoft: theme.tealSoft,
    white: theme.surface, background: theme.background, backgroundLight: theme.surfaceAlt, borderGray: theme.border,
    text: theme.text, textSecondary: theme.muted, textLight: theme.lightText, error: '#E85D4F',
  };
  return StyleSheet.create({
  figmaHeader: {
    height: 64,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  brand: { fontSize: 18, fontWeight: '700', color: colors.primary },
  bell: { fontSize: 18 },
  dayHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  daySub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  groceryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderGray,
  },
  groceryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groceryTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  groceryTotal: { fontSize: 16, fontWeight: '700', color: colors.primary },
  groceryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGray,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkOn: { backgroundColor: colors.secondary },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  groceryName: { flex: 1, fontSize: 14, color: colors.text },
  groceryDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
  groceryPrice: { fontSize: 13, fontWeight: '600', color: colors.text },
  addCustom: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderGray,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addCustomText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  altLine: { marginTop: 6, fontSize: 11, color: colors.primary },
  tag: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 10, fontWeight: '700' },
  mealThumb: { width: 96, height: 96, borderRadius: 12 },
  mealCopy: { flex: 1, justifyContent: 'center' },
  tipCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
  },

  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  tipTitle: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
  },

  tipClose: {
    fontSize: fonts.sizes.lg,
    color: colors.primary,
  },

  tipText: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },

  availabilityCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderColor: colors.borderGray,
    borderWidth: 1,
  },

  availabilityTitle: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  availabilityDesc: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  ingredientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },

  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderColor: colors.borderGray,
    borderWidth: 1,
  },

  ingredientItemUnavailable: {
    backgroundColor: '#FFE4E4',
    borderColor: '#E85D4F',
  },

  ingredientCheckbox: {
    fontSize: fonts.sizes.base,
    marginRight: spacing.sm,
    fontWeight: fonts.weights.bold,
  },

  ingredientName: {
    fontSize: fonts.sizes.xs,
    color: colors.text,
    fontWeight: fonts.weights.medium,
  },

  ingredientNameUnavailable: {
    color: '#E85D4F',
    textDecorationLine: 'line-through',
  },

  infoCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderColor: colors.borderGray,
    borderWidth: 1,
  },

  warningCard: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFEFEF',
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  infoLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: fonts.weights.medium,
  },

  infoBudget: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
  },

  infoCost: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.secondary,
  },

  costOverBudget: {
    color: '#E74C3C',
  },

  warningText: {
    color: '#E74C3C',
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
  },

  daySelector: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: 8,
  },

  dayButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    borderColor: colors.borderGray,
    borderWidth: 1,
  },

  dayButtonActive: {
    backgroundColor: '#FFDBCC',
    borderColor: '#FFDBCC',
  },

  dayButtonText: {
    fontSize: 12,
    fontWeight: fonts.weights.semibold,
    color: colors.textSecondary,
  },

  dayButtonTextActive: {
    color: colors.text,
    fontWeight: '700',
  },

  dailySummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  summaryItem: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderColor: colors.borderGray,
    borderWidth: 1,
  },

  summaryIcon: {
    fontSize: fonts.sizes.xl,
    marginBottom: spacing.xs,
  },

  summaryValue: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },

  summaryLabel: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  mealCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 8,
    marginBottom: spacing.md,
    borderColor: colors.borderGray,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  mealCardUnavailable: {
    borderColor: '#FFB3B3',
    backgroundColor: '#FFFBFB',
  },

  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  mealTypeEmoji: {
    fontSize: fonts.sizes.xl,
  },

  mealType: {
    fontSize: 11,
    fontWeight: fonts.weights.bold,
    letterSpacing: 0.6,
  },

  mealHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },

  unavailableIcon: {
    fontSize: fonts.sizes.lg,
  },

  changeText: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  mealInfo: {
    gap: spacing.md,
  },

  mealName: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },

  alternativesSuggestion: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
  },

  alternativesLabel: {
    fontSize: fonts.sizes.xs,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },

  alternativesText: {
    fontSize: fonts.sizes.xs,
    color: colors.text,
    lineHeight: 18,
  },

  mealMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  mealIcon: {
    fontSize: fonts.sizes.xl,
  },

  mealDetails: {
    flex: 1,
  },

  mealIngredients: {
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },

  mealStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  stat: {
    fontSize: fonts.sizes.xs,
    color: colors.text,
    fontWeight: fonts.weights.medium,
  },

  budgetAdjustContainer: {
    marginBottom: spacing.lg,
  },

  sectionLabel: {
    marginBottom: spacing.md,
  },

  budgetOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },

  budgetOption: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderColor: colors.borderGray,
    borderWidth: 1,
  },

  budgetOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  budgetOptionText: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
  },

  budgetOptionTextActive: {
    color: colors.white,
  },

  nutritionInfo: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderColor: colors.borderGray,
    borderWidth: 1,
  },

  nutritionTitle: {
    marginBottom: spacing.md,
  },

  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },

  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },

  nutritionIcon: {
    fontSize: fonts.sizes.xl,
    marginBottom: spacing.sm,
  },

  nutritionText: {
    fontSize: fonts.sizes.xs,
    textAlign: 'center',
    color: colors.text,
  },

  apiNutritionTitle: {
    marginTop: spacing.md,
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    color: colors.primary,
  },

  apiNutritionStatus: {
    marginTop: spacing.xs,
    fontSize: fonts.sizes.xs,
    color: colors.textSecondary,
  },

  apiNutritionItem: {
    marginTop: spacing.xs,
    fontSize: fonts.sizes.xs,
    color: colors.text,
  },

  actionButtons: {
    marginBottom: spacing.xl,
  },

  primaryAction: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryActionText: { color: '#FFFFFF', fontSize: fonts.sizes.base, fontWeight: fonts.weights.semibold },
  secondaryAction: {
    backgroundColor: colors.tealSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  secondaryActionText: { color: colors.secondary, fontSize: fonts.sizes.base, fontWeight: fonts.weights.semibold },
});
};


