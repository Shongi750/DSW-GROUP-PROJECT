import React, { useContext, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { colors, fonts, spacing, radius } from '../../utils/theme';
import Header from '../../components/common/Header';
import Button from '../../components/common/Button';
import { useAppTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { exportHtmlPdf, shoppingListHtml } from '../../services/pdfExport';

// Food items database with prices and categories
const FOOD_PRICES = {
  // Staples
  'Rice': { price: 25, category: 'Staples', unit: '2kg' },
  'Pap': { price: 12, category: 'Staples', unit: 'bag' },
  'Bread': { price: 18, category: 'Staples', unit: 'loaf' },
  'Oats': { price: 35, category: 'Staples', unit: '500g' },
  'Maize meal': { price: 15, category: 'Staples', unit: '2kg' },
  'Pasta': { price: 20, category: 'Staples', unit: '500g' },
  'Potatoes': { price: 30, category: 'Vegetables', unit: '5kg' },

  // Proteins
  'Chicken breast': { price: 120, category: 'Proteins', unit: '1kg' },
  'Eggs': { price: 35, category: 'Proteins', unit: 'dozen' },
  'Beans': { price: 18, category: 'Proteins', unit: '500g' },
  'Lentils': { price: 22, category: 'Proteins', unit: '500g' },
  'Pilchards': { price: 15, category: 'Proteins', unit: 'can' },
  'Peanut butter': { price: 45, category: 'Proteins', unit: '500g' },

  // Vegetables & Fruits
  'Carrots': { price: 25, category: 'Vegetables', unit: '1kg' },
  'Onion': { price: 20, category: 'Vegetables', unit: '1kg' },
  'Tomato': { price: 30, category: 'Vegetables', unit: '1kg' },
  'Spinach': { price: 28, category: 'Vegetables', unit: 'bunch' },
  'Pumpkin': { price: 20, category: 'Vegetables', unit: '1kg' },
  'Banana': { price: 28, category: 'Fruits', unit: '1kg' },
  'Berries': { price: 60, category: 'Fruits', unit: 'container' },

  // Dairy & Condiments
  'Milk': { price: 22, category: 'Dairy', unit: '1L' },
  'Amasi': { price: 18, category: 'Dairy', unit: '500ml' },
  'Butter': { price: 35, category: 'Dairy', unit: '250g' },
  'Oil': { price: 70, category: 'Condiments', unit: '1L' },
  'Tomato sauce': { price: 16, category: 'Condiments', unit: 'bottle' },
  'Sugar': { price: 25, category: 'Condiments', unit: '2.5kg' },
  'Muesli': { price: 48, category: 'Cereals', unit: '500g' },
};

export default function ShoppingListScreen({ navigation, route }) {
  const { theme } = useAppTheme();
  const { state } = useContext(AuthContext);
  const { ingredients = [], totalCost = 0, budget = 2500 } = route.params || {};
  
  const [checkedItems, setCheckedItems] = useState({});
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

  // Calculate shopping list with prices
  const shoppingListWithPrices = ingredients.map((ingredient) => {
    const priceData = FOOD_PRICES[ingredient] || {
      price: 50,
      category: 'Other',
      unit: 'item',
    };
    return {
      name: ingredient,
      ...priceData,
    };
  });

  // Group by category
  const groupedByCategory = shoppingListWithPrices.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  const categories = Object.keys(groupedByCategory).sort();

  const totalListPrice = shoppingListWithPrices.reduce((sum, item) => sum + item.price, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const budgetRemaining = budget - totalListPrice;
  const isUnderBudget = budgetRemaining >= 0;

  const toggleItem = (itemName) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  const toggleAll = () => {
    const allChecked = Object.values(checkedItems).every(Boolean);
    const newChecked = {};
    ingredients.forEach((item) => {
      newChecked[item] = !allChecked;
    });
    setCheckedItems(newChecked);
  };

  const handleExportList = async () => {
    try {
      await exportHtmlPdf(
        'UFitness shopping list',
        shoppingListHtml({
          studentName: state.user?.name,
          budget,
          total: totalListPrice,
          items: shoppingListWithPrices,
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
      <Header
        title="Shopping List"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Summary */}
        <View style={[styles.summaryCard, !isUnderBudget && styles.summaryCardWarning]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Cost</Text>
            <Text style={styles.summaryPrice}>R{totalListPrice}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Your Budget</Text>
            <Text style={styles.summaryBudget}>R{budget}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, styles.balanceLabel]}>Balance</Text>
            <Text
              style={[
                styles.summaryPrice,
                { color: isUnderBudget ? colors.secondary : '#E74C3C' },
              ]}
            >
              {isUnderBudget ? '+' : ''}R{budgetRemaining}
            </Text>
          </View>

          {!isUnderBudget && (
            <Text style={styles.warningMessage}>
              ⚠️ Over budget by R{Math.abs(budgetRemaining)}. Consider cheaper alternatives.
            </Text>
          )}
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              {checkedCount} of {ingredients.length} items purchased
            </Text>
            <TouchableOpacity onPress={toggleAll}>
              <Text style={styles.markAllLink}>
                {checkedCount === ingredients.length ? 'Uncheck All' : 'Check All'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(checkedCount / ingredients.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Shopping List by Category */}
        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryHeader}>{category}</Text>

            {groupedByCategory[category].map((item) => (
              <ShoppingListItem
                key={item.name}
                item={item}
                isChecked={checkedItems[item.name] || false}
                onToggle={() => toggleItem(item.name)}
              />
            ))}
          </View>
        ))}

        {/* Price Breakdown */}
        <TouchableOpacity
          style={styles.breakdownToggle}
          onPress={() => setShowPriceBreakdown(!showPriceBreakdown)}
        >
          <Text style={styles.breakdownToggleText}>
            {showPriceBreakdown ? '▼' : '▶'} Price Breakdown by Category
          </Text>
        </TouchableOpacity>

        {showPriceBreakdown && (
          <View style={styles.breakdown}>
            {categories.map((category) => {
              const categoryTotal = groupedByCategory[category].reduce(
                (sum, item) => sum + item.price,
                0
              );
              return (
                <View key={category} style={styles.breakdownRow}>
                  <Text style={styles.breakdownCategory}>{category}</Text>
                  <Text style={styles.breakdownPrice}>R{categoryTotal}</Text>
                </View>
              );
            })}
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownCategory, styles.breakdownTotal]}>TOTAL</Text>
              <Text style={[styles.breakdownPrice, styles.breakdownTotal]}>
                R{totalListPrice}
              </Text>
            </View>
          </View>
        )}

        {/* Money Saving Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 Money Saving Tips</Text>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>
              Buy dry goods (beans, lentils) in bulk for better value
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>
              Check for student discounts at Pick n Pay and Shoprite
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>
              Buy seasonal vegetables for lower prices
            </Text>
          </View>
          <View style={styles.tipItem}>
            <Text style={styles.tipIcon}>✓</Text>
            <Text style={styles.tipText}>
              Generic brands are often cheaper than name brands
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="📋 EXPORT LIST"
            onPress={handleExportList}
            variant="primary"
            fullWidth
            style={{ marginBottom: spacing.md }}
          />
          <Button
            title="← BACK TO MEAL PLAN"
            onPress={() => navigation.goBack()}
            variant="outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

// Shopping List Item Component
function ShoppingListItem({ item, isChecked, onToggle }) {
  return (
    <TouchableOpacity
      style={[styles.listItem, isChecked && styles.listItemChecked]}
      onPress={onToggle}
    >
      <View style={styles.itemCheckbox}>
        <Text style={styles.checkboxText}>{isChecked ? '✓' : '☐'}</Text>
      </View>

      <View style={styles.itemInfo}>
        <Text
          style={[
            styles.itemName,
            isChecked && styles.itemNameChecked,
          ]}
        >
          {item.name}
        </Text>
        <Text style={styles.itemUnit}>{item.unit}</Text>
      </View>

      <Text style={styles.itemPrice}>R{item.price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderColor: colors.borderGray,
    borderWidth: 1,
  },

  summaryCardWarning: {
    borderColor: '#FFB3B3',
    backgroundColor: '#FFFBFB',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  summaryLabel: {
    fontSize: fonts.sizes.sm,
    color: colors.textSecondary,
    fontWeight: fonts.weights.medium,
  },

  balanceLabel: {
    fontWeight: fonts.weights.bold,
  },

  summaryPrice: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
  },

  summaryBudget: {
    fontSize: fonts.sizes.lg,
    fontWeight: fonts.weights.bold,
    color: colors.text,
  },

  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderGray,
    marginVertical: spacing.md,
  },

  warningMessage: {
    color: '#E74C3C',
    fontSize: fonts.sizes.sm,
    marginTop: spacing.md,
    fontWeight: fonts.weights.medium,
  },

  progressContainer: {
    marginBottom: spacing.lg,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  progressText: {
    fontSize: fonts.sizes.sm,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
  },

  markAllLink: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: fonts.weights.semibold,
  },

  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.full,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
  },

  categorySection: {
    marginBottom: spacing.lg,
  },

  categoryHeader: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomColor: colors.borderGray,
    borderBottomWidth: 1,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderColor: colors.borderGray,
    borderWidth: 1,
  },

  listItemChecked: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },

  itemCheckbox: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  checkboxText: {
    fontSize: fonts.sizes.lg,
    color: colors.primary,
    fontWeight: fonts.weights.bold,
  },

  itemInfo: {
    flex: 1,
  },

  itemName: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: colors.textLight,
  },

  itemUnit: {
    fontSize: fonts.sizes.xs,
    color: colors.textLight,
  },

  itemPrice: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
    minWidth: 50,
    textAlign: 'right',
  },

  breakdownToggle: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  breakdownToggleText: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.semibold,
    color: colors.primary,
  },

  breakdown: {
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },

  breakdownCategory: {
    fontSize: fonts.sizes.sm,
    color: colors.text,
  },

  breakdownPrice: {
    fontSize: fonts.sizes.sm,
    color: colors.primary,
    fontWeight: fonts.weights.semibold,
  },

  breakdownDivider: {
    height: 1,
    backgroundColor: colors.borderGray,
    marginVertical: spacing.md,
  },

  breakdownTotal: {
    fontWeight: fonts.weights.bold,
    fontSize: fonts.sizes.base,
  },

  tipsSection: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  tipsTitle: {
    fontSize: fonts.sizes.base,
    fontWeight: fonts.weights.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },

  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },

  tipIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: fonts.weights.bold,
  },

  tipText: {
    flex: 1,
    fontSize: fonts.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },

  actionButtons: {
    marginBottom: spacing.xl,
  },
});
