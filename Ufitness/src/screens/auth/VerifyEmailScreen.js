import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { friendlyAuthError } from '../../lib/authErrors';

export default function VerifyEmailScreen() {
  const { user, profile, resendVerificationEmail, confirmEmailVerified, logout, verificationError } = useApp();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [sendHint, setSendHint] = useState('');
  const email = user?.email || profile.email || '';

  useEffect(() => {
    const timer = setInterval(() => {
      confirmEmailVerified().catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [confirmEmailVerified]);

  const handleResend = async () => {
    setBusy(true);
    try {
      await resendVerificationEmail();
      setSendHint('Firebase accepted the send. If UJ still shows nothing, it blocked the sender — not junk.');
      Alert.alert('Sent again', 'Search that inbox for noreply or firebase. If it is not YOUR student number, use a different email.');
    } catch (error) {
      Alert.alert('Could not resend', friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleChecked = async () => {
    setBusy(true);
    try {
      const verified = await confirmEmailVerified();
      if (!verified) {
        Alert.alert(
          'Not verified yet',
          'Open the email we sent, tap the link, then come back here.',
        );
      }
    } catch (error) {
      Alert.alert('Could not check', friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, minHeight: 0, backgroundColor: colors.background }}
      contentContainerStyle={[styles.screenContainer, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerSection}>
        <View style={styles.logoCircle}>
          <FontAwesome5 name="dumbbell" size={32} color="#FFFFFF" />
        </View>
        <Text style={[styles.appTitle, { color: colors.brand }]}>UFitness</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Confirm your UJ email</Text>
        <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
          No account exists until you open the link we sent to {email || 'your UJ student inbox'}.
          Search for UFitness or the team Gmail after SMTP is on. The link is the only way to create the account.
        </Text>
        {verificationError ? (
          <Text style={styles.errorText}>{verificationError}</Text>
        ) : null}
        {sendHint ? (
          <Text style={[styles.hintText, { color: colors.muted }]}>{sendHint}</Text>
        ) : null}

        <TouchableOpacity style={styles.loginButton} onPress={handleChecked} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>I opened the link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleResend} disabled={busy}>
          <Text style={[styles.secondaryButtonText, { color: colors.brand }]}>Resend email</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={logout} disabled={busy}>
          <Text style={[styles.useDifferent, { color: colors.muted }]}>Use a different email</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flexGrow: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E67E45',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '600',
    color: '#8B4513',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 17,
    color: '#665952',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#B42318',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  useDifferent: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
});
