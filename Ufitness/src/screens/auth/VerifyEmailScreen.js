import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { friendlyAuthError } from '../../lib/authErrors';
import { maskStudentInbox, studentNumberFromEmail } from '../../lib/ujEmail';
import AuthBackdrop, { GlassSheet } from './AuthBackdrop';

const UJ_LOGO = require('../../../assets/uj-gym-logo.png');

export default function VerifyEmailScreen() {
  const { pendingOtpEmail, verifySignupCode, resendVerificationEmail, clearPendingOtp } = useApp();
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeOk, setNoticeOk] = useState(false);

  const handleVerify = async () => {
    setNotice('');
    setNoticeOk(false);
    setBusy(true);
    try {
      await verifySignupCode(code);
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setNotice('');
    setNoticeOk(false);
    setBusy(true);
    try {
      await resendVerificationEmail();
      setNoticeOk(true);
      setNotice(`A new code was sent to ${maskStudentInbox(pendingOtpEmail)}. Check Junk as well.`);
    } catch (error) {
      setNoticeOk(false);
      setNotice(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthBackdrop>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: 'transparent' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.screen}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandTop}>
            <Image source={UJ_LOGO} style={styles.logo} resizeMode="contain" />
            <View style={styles.wordmarkRow}>
              <Text style={styles.u}>U</Text>
              <Text style={[styles.fitness, { color: colors.accent }]}>FITNESS</Text>
            </View>
          </View>
          <View style={styles.air} />
          <GlassSheet>
            <Text style={styles.heading}>Enter the code</Text>
            <Text style={styles.subheading}>
              8-digit code sent to your UJ inbox
              {pendingOtpEmail
                ? ` for student ${studentNumberFromEmail(pendingOtpEmail) || 'number'}.`
                : '.'}
            </Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 8))}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={8}
              placeholder="00000000"
              placeholderTextColor="#8A8A8A"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
            />
            {notice ? (
              <View
                style={[
                  styles.notice,
                  noticeOk
                    ? {
                        backgroundColor: 'rgba(255,106,0,0.16)',
                        borderColor: 'rgba(255,106,0,0.45)',
                      }
                    : {
                        backgroundColor: 'rgba(255,106,0,0.16)',
                        borderColor: 'rgba(255,106,0,0.45)',
                      },
                ]}
              >
                <Text style={styles.noticeText}>{notice}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.whiteCta}
              onPress={handleVerify}
              disabled={busy || code.length !== 8}
              activeOpacity={0.9}
            >
              {busy ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <>
                  <Text style={styles.whiteCtaText}>CONFIRM</Text>
                  <View style={[styles.ctaArrow, { backgroundColor: colors.accent }]}>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </View>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={handleResend} disabled={busy} style={styles.linkBtn}>
              <Text style={[styles.link, { color: colors.accentBright || colors.accent }]}>Send a new code</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearPendingOtp} disabled={busy} style={styles.linkBtn}>
              <Text style={[styles.link, { color: '#C9C9C9' }]}>Use a different email</Text>
            </TouchableOpacity>
          </GlassSheet>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
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
  air: { flexGrow: 1, minHeight: 100 },
  heading: {
    fontFamily: 'Anton_400Regular',
    fontSize: 28,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: '#C9C9C9',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 6,
    fontSize: 28,
    letterSpacing: 6,
    textAlign: 'center',
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF',
  },
  notice: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  noticeText: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: '#FFB27A' },
  whiteCta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  whiteCtaText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtn: { alignItems: 'center', paddingVertical: 6 },
  link: { fontWeight: '800', fontSize: 14 },
});
