import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatRand, planTotal } from '../lib/coachCore';

const ICONS = { meals: 'restaurant-outline', workout: 'barbell-outline', week: 'calendar-outline' };

// A plan the coach proposed (structured JSON from the propose_plan tool), shown under its reply.
export default function CoachPlanCard({ plan, colors }) {
  if (!plan?.days?.length) return null;
  const total = planTotal(plan);
  return (
    <View style={[styles.card, { borderColor: 'rgba(255,106,0,0.35)' }]}>
      <View style={styles.head}>
        <Ionicons name={ICONS[plan.kind] || 'sparkles-outline'} size={16} color={colors.brand} />
        <Text style={styles.title} numberOfLines={2}>{plan.title}</Text>
      </View>
      {plan.budgetRand || total ? (
        <Text style={styles.budget}>
          {plan.budgetRand ? `Budget ${formatRand(plan.budgetRand)}` : ''}
          {plan.budgetRand && total ? ' · ' : ''}
          {total ? `About ${formatRand(total)}` : ''}
        </Text>
      ) : null}
      {plan.days.map((day) => (
        <View key={day.day} style={styles.day}>
          <Text style={[styles.dayName, { color: colors.brand }]}>{day.day.toUpperCase()}</Text>
          {day.items.map((item, index) => (
            <View key={`${day.day}-${index}`} style={styles.item}>
              <Text style={styles.itemName}>
                {item.name}
                {item.costRand ? <Text style={styles.cost}>  {formatRand(item.costRand)}</Text> : null}
              </Text>
              {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
            </View>
          ))}
        </View>
      ))}
      {plan.tips?.length ? (
        <View style={styles.tips}>
          {plan.tips.map((tip) => (
            <Text key={tip} style={styles.tip}>• {tip}</Text>
          ))}
        </View>
      ) : null}
      <Text style={styles.disclaimer}>General guidance, not medical advice. Prices are estimates.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  budget: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4, fontWeight: '700' },
  day: { marginTop: 10 },
  dayName: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  item: { marginTop: 4 },
  itemName: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  cost: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 12 },
  detail: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 1 },
  tips: { marginTop: 10 },
  tip: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 17 },
  disclaimer: { color: 'rgba(255,255,255,0.45)', fontSize: 10.5, marginTop: 10 },
});
