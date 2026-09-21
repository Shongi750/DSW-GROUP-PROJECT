import React, { createContext, useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

export const WorkoutLeaveContext = createContext({
  onLeave: null,
  consumeTopInset: false,
});

export function useWorkoutLeave() {
  return useContext(WorkoutLeaveContext);
}

export function LeaveBar() {
  const { onLeave } = useWorkoutLeave();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (!onLeave) return null;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Pressable onPress={onLeave} hitSlop={10} style={styles.btn}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
        <Text style={[styles.label, { color: colors.text }]}>Home</Text>
      </Pressable>
    </View>
  );
}

export function WorkoutLeaveProvider({ onLeave, children }) {
  return (
    <WorkoutLeaveContext.Provider value={{ onLeave: onLeave || null, consumeTopInset: false }}>
      {children}
    </WorkoutLeaveContext.Provider>
  );
}

export function WorkoutPageChrome({ children }) {
  const leave = useWorkoutLeave();
  return (
    <WorkoutLeaveContext.Provider value={{ onLeave: leave.onLeave, consumeTopInset: Boolean(leave.onLeave) }}>
      <View style={styles.fill}>
        {leave.onLeave ? <LeaveBar /> : null}
        <View style={styles.fill}>{children}</View>
      </View>
    </WorkoutLeaveContext.Provider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  wrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  btn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: { fontSize: 16, fontWeight: '700', marginLeft: 2 },
});
