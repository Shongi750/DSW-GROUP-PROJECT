import { useEffect, useState } from 'react';
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
import { friendlyAuthError, AUTH_HINTS } from '../../lib/authErrors';
import { maskStudentInbox, studentNumberFromEmail } from '../../lib/ujEmail';
import { resendErrorInfo, resendLabel, secondsLeft } from '../../lib/resendCooldown';
import AuthBackdrop, { GlassSheet } from './AuthBackdrop';

const UJ_LOGO = require('../../../assets/uj-gym-logo.png');

// After register, user types the 8-digit code from their UJ email.
// "Send a new code" has a 60 s cooldown; "Use a different email" goes back to
// Register with the fields still filled in.
export default function VerifyEmailScreen() {
  const { pendingOtpEmail, codeSentAt, verifySignupCode, resendVerificationEmail, backToRegister } = useApp();
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeOk, setNoticeOk] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [waitUntil, setWaitUntil] = useState(0); // extra wait Supabase asked for

  const waitLeft = Math.max(
    secondsLeft(codeSentAt, now),
    waitUntil > now ? Math.ceil((waitUntil - now) / 1000) : 0
  );

  // Tick once a second only while the cooldown is running.
  const counting = waitLeft > 0;
  useEffect(() => {
    if (!counting) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [counting]);

  async function handleVerify() {
    setNotice('');
    setNoticeOk(false);
    if (String(code).trim().length !== 8) {
      setNotice(AUTH_HINTS.needCode);
      return;
    }
    setBusy(true);
    try {
      await verifySignupCode(code);
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleResend() {
    if (waitLeft > 0) return;
    setNotice('');
    setNoticeOk(false);
    setBusy(true);
    try {
      await resendVerificationEmail();
      setNow(Date.now());
      setNoticeOk(true);
      setNotice(
        'A new code was sent to ' +
          maskStudentInbox(pendingOtpEmail) +
          '. Check Junk as well. Only the newest code works.'
      );
    } catch (error) {
      const info = resendErrorInfo(error);
      if (info.waitSeconds) {
        setWaitUntil(Date.now() + info.waitSeconds * 1000);
        setNow(Date.now());
      }
      setNoticeOk(false);
      setNotice(info.message || friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  let studentLine = '.';
  if (pendingOtpEmail) {
    const num = studentNumberFromEmail(pendingOtpEmail) || 'number';
    studentLine = ` for student ${num}.`;
  }

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
              8-digit code sent to your UJ inbox{studentLine}
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
                  noticeOk ? styles.noticeOk : styles.noticeErr,
                ]}
              >
                <Text
                  style={[
                    styles.noticeText,
                    noticeOk ? styles.noticeOkText : null,
                  ]}
                >
                  {notice}
                </Text>
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
            <TouchableOpacity onPress={handleResend} disabled={busy || waitLeft > 0} style={styles.linkBtn}>
              <Text
                style={[
                  styles.link,
                  { color: waitLeft > 0 ? '#8A8A8A' : colors.accentBright || colors.accent },
                ]}
              >
                {resendLabel(waitLeft)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={backToRegister} disabled={busy} style={styles.linkBtn}>
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
  noticeErr: {
    backgroundColor: 'rgba(255,106,0,0.16)',
    borderColor: 'rgba(255,106,0,0.45)',
  },
  noticeOk: {
    backgroundColor: 'rgba(46,160,67,0.18)',
    borderColor: 'rgba(46,160,67,0.5)',
  },
  noticeText: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: '#FFB27A' },
  noticeOkText: { color: '#9BE39B' },
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
