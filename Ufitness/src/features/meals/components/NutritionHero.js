import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme, radius, display } from '../../../context/ThemeContext';
import { PHOTO_GLASS } from '../../../components/PhotoShell';

function MacroBar({ label, value, target, color, muted }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  return (
    <View style={styles.macro}>
      <View style={styles.macroTop}>
        <Text style={[styles.macroLabel, { color: muted }]}>{label}</Text>
        <Text style={[styles.macroValue, { color: muted }]}>
          {Math.round(value)} / {Math.round(target)}g
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function NutritionHero({
  eatenKcal = 0,
  eatenProtein = 0,
  eatenCarbs = 0,
  targetKcal = 2200,
  targetProtein = 120,
  targetCarbs = 220,
  plannedKcal = 0,
}) {
  const { colors } = useTheme();
  const remaining = Math.max(0, targetKcal - eatenKcal);
  const kcalPct = targetKcal > 0 ? Math.min(1, eatenKcal / targetKcal) : 0;
  const over = eatenKcal > targetKcal;

  return (
    <View style={[styles.wrap, PHOTO_GLASS]}>
      <Text style={[styles.kicker, { color: colors.accentBright || colors.accent }]}>TODAY</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.big, { color: over ? '#FF5A5A' : '#FFFFFF' }]}>
            {over ? `+${Math.round(eatenKcal - targetKcal)}` : Math.round(remaining)}
          </Text>
          <Text style={[styles.unit, { color: '#C9C9C9' }]}>
            {over ? 'kcal over' : 'kcal left'}
          </Text>
        </View>
        <View style={styles.ringWrap}>
          <View style={[styles.ring, { borderColor: 'rgba(255,106,0,0.22)' }]}>
            <View
              style={[
                styles.ringFill,
                {
                  borderColor: colors.accent,
                  // Approximate progress via border width illusion — solid center shows %
                },
              ]}
            >
              <Text style={[styles.ringPct, { color: '#FFFFFF' }]}>{Math.round(kcalPct * 100)}%</Text>
              <Text style={[styles.ringSub, { color: '#C9C9C9' }]}>eaten</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.kcalTrack, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
        <View
          style={[
            styles.kcalFill,
            {
              width: `${kcalPct * 100}%`,
              backgroundColor: over ? '#FF5A5A' : colors.accent,
            },
          ]}
        />
      </View>
      <Text style={[styles.planned, { color: '#C9C9C9' }]}>
        {Math.round(eatenKcal)} eaten · plan ~{Math.round(plannedKcal)} kcal
      </Text>

      <View style={styles.macros}>
        <MacroBar
          label="Protein"
          value={eatenProtein}
          target={targetProtein}
          color={colors.accent}
          muted="#C9C9C9"
        />
        <MacroBar
          label="Carbs"
          value={eatenCarbs}
          target={targetCarbs}
          color="#FF8A1A"
          muted="#C9C9C9"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 18,
    marginTop: 8,
    marginBottom: 4,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  big: {
    ...display,
    fontSize: 48,
    letterSpacing: 0.5,
    lineHeight: 52,
  },
  unit: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  ringWrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: {
    fontSize: 18,
    fontWeight: '800',
  },
  ringSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  kcalTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
  },
  kcalFill: {
    height: '100%',
    borderRadius: 999,
  },
  planned: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  macros: {
    marginTop: 16,
    gap: 12,
  },
  macro: {
    gap: 6,
  },
  macroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
