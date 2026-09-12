// screens/ProfileScreen.js
//
// Minimal profile tab showing the signed-in student's own info and a
// logout button. Extend this later with an edit-profile flow (module 9).

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { logOut } from '../services/authService';

// Props: currentStudent (student profile object)
export default function ProfileScreen({ currentStudent }) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogOut = async () => {
    setLoggingOut(true);
    try {
      await logOut();
      // No navigation needed - RootNavigator's auth listener detects the
      // signed-out state and switches back to AuthNavigator.
    } catch (error) {
      Alert.alert('Log out failed', error.message);
      setLoggingOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{currentStudent.name.charAt(0)}</Text>
      </View>
      <Text style={styles.name}>{currentStudent.name}</Text>
      <Text style={styles.meta}>
        {currentStudent.campus} · {currentStudent.experienceLevel}
      </Text>

      <View style={styles.infoCard}>
        <InfoRow label="Fitness goal" value={currentStudent.fitnessGoal} />
        <InfoRow label="Preferred location" value={currentStudent.workoutLocation} />
        <InfoRow label="Training days" value={currentStudent.preferredSchedule.join(', ')} />
      </View>

      <Pressable style={styles.logoutButton} onPress={handleLogOut} disabled={loggingOut}>
        {loggingOut ? <ActivityIndicator color="#fff" /> : <Text style={styles.logoutText}>Log Out</Text>}
      </Pressable>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F8', padding: 20, alignItems: 'center' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 28 },
  name: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginTop: 12 },
  meta: { fontSize: 13, color: '#6b6b6b', marginTop: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 24, width: '100%' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { color: '#8a8a8a', fontSize: 13 },
  infoValue: { color: '#2a2a2a', fontSize: 13, fontWeight: '600' },
  logoutButton: {
    backgroundColor: '#E5484D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 32,
  },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
