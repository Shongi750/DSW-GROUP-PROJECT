import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import AuthBackdrop, { GlassSheet } from './AuthBackdrop';

// Shown instead of the app while Campus Admin has suspended this account.
// The server blocks posting anyway (RLS); this screen just explains it.
export default function SuspendedScreen() {
  const { suspension, recheckSuspension, logout } = useApp();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function checkAgain() {
    setBusy(true);
    const next = await recheckSuspension();
    setBusy(false);
    if (next.suspended) setNote('Still suspended. Contact Campus Admin if you think this is a mistake.');
  }

  return (
    <AuthBackdrop>
      <View style={styles.screen}>
        <GlassSheet>
          <Ionicons name="lock-closed-outline" size={32} color="#FF8A1A" />
          <Text style={styles.heading}>Your account is suspended</Text>
          <Text style={styles.copy}>
            Campus Admin paused this account after a report. While it is suspended you can’t post in groups, send
            messages or share to the community.
          </Text>
          {suspension?.reason ? <Text style={styles.reason}>Reason: {suspension.reason}</Text> : null}
          {note ? <Text style={styles.note}>{note}</Text> : null}
          <TouchableOpacity style={styles.primary} onPress={checkAgain} disabled={busy}>
            {busy ? <ActivityIndicator color="#0A0A0A" /> : <Text style={styles.primaryText}>CHECK AGAIN</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.link} onPress={logout} disabled={busy}>
            <Text style={styles.linkText}>Sign out</Text>
          </TouchableOpacity>
        </GlassSheet>
      </View>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 36 },
  heading: {
    fontFamily: 'Anton_400Regular',
    fontSize: 26,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  copy: { fontSize: 14, lineHeight: 20, color: '#C9C9C9' },
  reason: { fontSize: 14, color: '#FFB27A', marginTop: 12, fontWeight: '600' },
  note: { fontSize: 13, color: '#C9C9C9', marginTop: 12 },
  primary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryText: { color: '#0A0A0A', fontWeight: '800', letterSpacing: 1.2 },
  link: { alignItems: 'center', paddingVertical: 12 },
  linkText: { color: '#C9C9C9', fontWeight: '800' },
});
