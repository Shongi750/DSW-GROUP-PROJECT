import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import { AVATAR_URI } from '../data/planner';

export default function AppHeader({ onAvatarPress, onBellPress }) {
  const { colors: theme } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable onPress={onAvatarPress} hitSlop={8}>
        <Image source={{ uri: AVATAR_URI }} style={styles.avatar} resizeMode="cover" />
      </Pressable>

      <View style={styles.brand}>
        <View style={styles.mark}>
          <Ionicons name="fitness" size={14} color={colors.white} />
        </View>
        <Text style={[styles.brandText, { color: theme.text }]}>UFitness</Text>
      </View>

      <Pressable onPress={onBellPress} hitSlop={8} style={styles.bellWrap}>
        <Ionicons name="notifications-outline" size={22} color={theme.text} />
        <View style={styles.badge} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.prepBg,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  bellWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
});
