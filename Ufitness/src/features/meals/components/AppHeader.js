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
        <Text style={[styles.brandText, { color: theme.text }]}>U</Text>
        <Text style={[styles.brandText, { color: colors.primary }]}>FITNESS</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.prepBg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: 'Anton_400Regular',
    fontSize: 22,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
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
