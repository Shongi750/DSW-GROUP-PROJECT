import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BarChart({ title, series = [], color = '#FF6A00', track, labelColor }) {
  const max = Math.max(...series.map((item) => Number(item.value) || 0), 1);
  return (
    <View style={styles.wrap}>
      {title ? <Text style={[styles.title, { color: labelColor }]}>{title}</Text> : null}
      {series.map((item) => {
        const width = `${Math.round((Number(item.value) / max) * 100)}%`;
        return (
          <View key={item.label} style={styles.row}>
            <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
              {item.label}
            </Text>
            <View style={[styles.track, { backgroundColor: track }]}>
              <View style={[styles.fill, { width, backgroundColor: color }]} />
            </View>
            <Text style={[styles.value, { color: labelColor }]}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8 },
  title: {
    fontFamily: 'Anton_400Regular',
    letterSpacing: 0.8,
    fontSize: 15,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  label: { width: 78, fontSize: 12, fontWeight: '600' },
  track: { flex: 1, height: 10, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  value: { width: 36, fontSize: 12, fontWeight: '700', textAlign: 'right' },
});
