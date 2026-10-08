import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { authenticateUnlock, biometricLabel } from '../../lib/biometrics';
import { friendlyAuthError, AUTH_HINTS } from '../../lib/authErrors';
import AuthBackdrop, { GlassSheet } from './AuthBackdrop';

const UJ_LOGO = require('../../../assets/uj-gym-logo.png');

// Shown when they reopen the app with biometrics turned on.
// Tries Face ID / fingerprint first, password is the fallback.
export default function UnlockScreen() {
  const { unlockSession, logout, user } = useApp();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('biometrics');

  useEffect(function () {
    biometricLabel().then(function (name) {
      setLabel(name);
    });
  }, []);

  // silent=true means "try on open, don't show an alert if they cancel"
  async function handleUnlock(silent) {
    setBusy(true);
    try {
      const ok = await authenticateUnlock('Unlock UFitness with ' + label);
      if (ok) {
        unlockSession();
      } else if (!silent) {
        Alert.alert(
          'Not recognized',
          'Try ' + label + ' again, or sign in with your password.'
        );
      }
    } catch (error) {
      if (!silent) {
        Alert.alert('Could not unlock', friendlyAuthError(error) || AUTH_HINTS.unlockFailed);
      }
    } finally {
      setBusy(false);
    }
  }

  // auto-prompt once when the screen mounts
  useEffect(function () {
    handleUnlock(true);
  }, []);

  function handlePassword() {
    Alert.alert(
      'Use password',
      'This signs you out of the saved session so you can type your password.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: function () { logout(); } },
      ]
    );
  }

  const email = (user && user.email) || 'Saved session';

  return (
    <AuthBackdrop>
      <View style={styles.screen}>
        <View style={styles.brandTop}>
          <Image source={UJ_LOGO} style={styles.logo} resizeMode="contain" />
          <View style={styles.wordmarkRow}>
            <Text style={styles.u}>U</Text>
            <Text style={[styles.fitness, { color: colors.accent }]}>FITNESS</Text>
          </View>
        </View>
        <View style={styles.air} />
        <GlassSheet>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            {email} is signed in. Unlock with {label}.
          </Text>
          <TouchableOpacity
            style={[styles.unlockButton, { backgroundColor: colors.accent }]}
            onPress={function () { handleUnlock(false); }}
            disabled={busy}
            activeOpacity={0.9}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="finger-print" size={22} color="#FFFFFF" />
                <Text style={styles.unlockText}>Unlock with {label}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePassword} disabled={busy} style={styles.alt}>
            <Text style={[styles.altText, { color: colors.accentBright || colors.accent }]}>
              Use password instead
            </Text>
          </TouchableOpacity>
        </GlassSheet>
      </View>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 36,
    justifyContent: 'flex-end',
  },
  brandTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: { width: 52, height: 52 },
  wordmarkRow: { flexDirection: 'row' },
  u: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    letterSpacing: 1.5,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  fitness: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  air: { flexGrow: 1, minHeight: 120 },
  title: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#C9C9C9',
    lineHeight: 20,
    marginBottom: 22,
  },
  unlockButton: {
    borderRadius: 999,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  unlockText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  alt: { alignItems: 'center', paddingVertical: 6 },
  altText: { fontSize: 14, fontWeight: '800' },
});
