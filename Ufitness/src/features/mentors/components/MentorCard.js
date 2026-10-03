import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, radius, display } from '../../../context/ThemeContext';
import { PHOTO_GLASS } from '../../../components/PhotoShell';

const EXPERTISE_TINTS_DARK = {
  Fitness: { backgroundColor: 'rgba(255,106,0,0.14)', color: '#FFB27A' },
  Nutrition: { backgroundColor: 'rgba(255,138,26,0.16)', color: '#FF8A1A' },
  'Strength Training': { backgroundColor: 'rgba(255,106,0,0.18)', color: '#FF8A1A' },
};
const EXPERTISE_TINTS_LIGHT = {
  Fitness: { backgroundColor: 'rgba(255,106,0,0.10)', color: '#C2410C' },
  Nutrition: { backgroundColor: 'rgba(255,106,0,0.12)', color: '#B45309' },
  'Strength Training': { backgroundColor: '#fce6d6', color: '#8b4a1b' },
};

export default function MentorCard({ mentor, onPress, onPressConnect, onPressChat, connectLabel }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  const handleConnect = onPressConnect || onPress;
  const handleChat = onPressChat || onPress;
  const label = connectLabel || 'Connect';
  const requested = label !== 'Connect';

  const expertiseTints = isDark ? EXPERTISE_TINTS_DARK : EXPERTISE_TINTS_LIGHT;
  const selectedExpertiseStyle = expertiseTints[mentor.expertise] || {
    backgroundColor: isDark ? colors.overlay : '#e5e7eb',
    color: colors.text,
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.header}>
          <Image
            source={{ uri: mentor.photo || 'https://via.placeholder.com/60' }}
            style={styles.avatar}
          />
          <View style={styles.info}>
            <Text style={styles.name}>{mentor.name}</Text>
            <Text style={styles.subText}>{mentor.year} • {mentor.level}</Text>
          </View>
        </View>

        <View style={styles.campusBadge}>
          <Text style={styles.campusText}>{mentor.campus || 'APK'}</Text>
        </View>
      </View>

      <View style={styles.expertiseRow}>
        <View
          style={[
            styles.expertiseTag,
            { backgroundColor: selectedExpertiseStyle.backgroundColor },
          ]}
        >
          <Text style={[styles.expertiseText, { color: selectedExpertiseStyle.color }]}>
            {mentor.expertise}
          </Text>
        </View>
      </View>

      <Text style={styles.quote}>
        {mentor.quote || 'Looking for someone to spot me on bench days and keep me accountable at 6 AM.'}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity style={[styles.connectBtn, requested && styles.connectBtnRequested]} onPress={handleConnect}>
          <View style={styles.buttonContent}>
            <Ionicons name={requested ? 'hourglass-outline' : 'person-add'} size={20} color="#fff" />
            <Text style={styles.connectText}>{label}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.brand} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    card: {
      ...PHOTO_GLASS,
      borderRadius: radius.card,
      padding: 16,
      marginVertical: 10,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0 : 0.1,
      shadowRadius: 6,
      elevation: isDark ? 0 : 3,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    header: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: isDark ? colors.overlay : '#eee' },
    info: { marginLeft: 12, flex: 1 },
    name: { ...display, fontSize: 18, color: '#FFFFFF', textTransform: 'none', letterSpacing: 0.3 },
    subText: { color: '#C9C9C9' },
    campusBadge: {
      backgroundColor: isDark ? 'rgba(255,106,0,0.16)' : 'rgba(255,106,0,0.10)',
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginLeft: 12,
    },
    campusText: { color: isDark ? '#FFB27A' : '#C2410C', fontSize: 12, fontWeight: 'bold' },
    expertiseRow: { marginBottom: 8 },
    expertiseTag: {
      alignSelf: 'flex-start',
      borderRadius: radius.pill,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    expertiseText: {
      fontSize: 12,
      fontWeight: '700',
    },
    quote: { color: '#C9C9C9', fontStyle: 'italic', marginBottom: 12 },
    buttons: { flexDirection: 'row', alignItems: 'center' },
    connectBtn: {
      flex: 1,
      backgroundColor: colors.brand,
      paddingVertical: 11,
      borderRadius: radius.pill,
      marginRight: 8,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    connectBtnRequested: {
      backgroundColor: isDark ? colors.overlay : '#c2410c',
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.border,
    },
    connectText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
    chatBtn: {
      width: 52,
      height: 42,
      borderWidth: 1,
      borderColor: colors.brand,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
