import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSyncStatus, subscribeSyncStatus } from '../lib/syncStatus';

// Small pill that tells the student where their data is saved.
// 'Offline' = changes are queued and sent automatically when the phone reconnects.
const LOOK = {
  saving: { label: 'Saving…', icon: null, color: '#FFB27A' },
  syncing: { label: 'Syncing…', icon: null, color: '#FFB27A' },
  offline: { label: 'Offline', icon: 'cloud-offline-outline', color: '#FACC15' },
  synced: { label: 'Synced', icon: 'cloud-done-outline', color: '#4ADE80' },
  local: { label: 'Saved on this phone only', icon: 'phone-portrait-outline', color: '#FACC15' },
  missing: { label: 'Cloud not set up', icon: 'cloud-offline-outline', color: '#F87171' },
};

export default function SyncStatus({ style }) {
  const [status, setStatus] = useState(getSyncStatus());

  useEffect(() => subscribeSyncStatus(setStatus), []);

  const look = LOOK[status];
  if (!look) return null; // 'idle' → nothing to say yet

  return (
    <View style={[styles.pill, style]} accessibilityRole="text" accessibilityLabel={`Sync status: ${look.label}`}>
      {look.icon ? (
        <Ionicons name={look.icon} size={13} color={look.color} />
      ) : (
        <ActivityIndicator size="small" color={look.color} style={styles.spinner} />
      )}
      <Text style={[styles.label, { color: look.color }]}>{look.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(10,10,10,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  spinner: { transform: [{ scale: 0.7 }], width: 13, height: 13 },
  label: { fontSize: 11.5, fontWeight: '700' },
});
