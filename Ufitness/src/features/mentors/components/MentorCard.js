import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';

export default function MentorCard({ mentor, onPress, onPressConnect, onPressChat, connectLabel }) {
  const { colors, isDark } = useTheme();
  const handleConnect = onPressConnect || onPress;
  const handleChat = onPressChat || onPress;
  const label = connectLabel || 'Connect';
  const requested = label !== 'Connect';

  const expertiseStyles = {
    Fitness: { backgroundColor: '#d9f5df', color: '#1b4d3e' },
    Nutrition: { backgroundColor: '#dfeafc', color: '#1d3b6b' },
    'Strength Training': { backgroundColor: '#fce6d6', color: '#8b4a1b' },
  };

  const selectedExpertiseStyle = expertiseStyles[mentor.expertise] || {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={styles.header}>
          <Image
            source={{ uri: mentor.photo || 'https://via.placeholder.com/60' }}
            style={styles.avatar}
          />
          <View style={styles.info}>
            <Text style={[styles.name, { color: colors.text }]}>{mentor.name}</Text>
            <Text style={[styles.subText, { color: colors.muted }]}>{mentor.year} • {mentor.level}</Text>
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

      <Text style={[styles.quote, { color: colors.muted }]}>
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
          <View style={styles.chatBubble}>
            <View style={styles.chatLine} />
            <View style={styles.chatLine} />
            <View style={styles.chatLine} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  info: { marginLeft: 12, flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  subText: { color: 'gray' },
  campusBadge: {
    backgroundColor: '#113d2d',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 12,
  },
  campusText: { color: '#b7f7c5', fontSize: 12, fontWeight: 'bold' },
  expertiseRow: { marginBottom: 8 },
  expertiseTag: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  expertiseText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quote: { color: '#444', fontStyle: 'italic', marginBottom: 12 },
  buttons: { flexDirection: 'row', alignItems: 'center' },
  connectBtn: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIcon: { fontSize: 16, marginRight: 6, color: '#fff' },
  connectBtnRequested: {
    backgroundColor: '#c2410c',
  },
  connectText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  chatBtn: {
    width: 52,
    height: 42,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBubble: {
    width: 20,
    height: 16,
    borderWidth: 2,
    borderColor: '#334155',
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chatLine: {
    height: 2,
    backgroundColor: '#334155',
    borderRadius: 2,
    marginVertical: 1,
  },
});
