import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import { useTheme, radius, display } from "../../context/ThemeContext";
import AuthBackdrop, { GlassSheet } from "./AuthBackdrop";
import { friendlyAuthError, AUTH_HINTS } from "../../lib/authErrors";
import { accountFromStudentOrEmail } from "../../lib/ujEmail";
import { forgetLoginEmail, recallLoginEmail, rememberLoginEmail } from "../../lib/rememberLogin";
import { promptEnableAfterLogin } from "../../lib/biometrics";

const UJ_LOGO = require("../../../assets/uj-gym-logo.png");

// Sign in with UJ student number → we turn that into the campus email in ujEmail.js
export default function LoginScreen({ navigation }) {
  const { login, resetPassword } = useApp();
  const { colors } = useTheme();
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeOk, setNoticeOk] = useState(false);

  useEffect(function loadSavedLogin() {
    recallLoginEmail().then(function (saved) {
      if (saved) {
        setStudentNumber(saved);
        setRememberMe(true);
      }
    });
  }, []);

  function resolveAccount() {
    return accountFromStudentOrEmail(studentNumber);
  }

  function showError(message) {
    setNoticeOk(false);
    setNotice(message);
  }

  function showSuccess(message) {
    setNoticeOk(true);
    setNotice(message);
  }

  async function handleLogin() {
    const number = String(studentNumber).trim();
    if (!number && !password) {
      showError(AUTH_HINTS.needBoth);
      return;
    }
    if (!number) {
      showError(AUTH_HINTS.needNumber);
      return;
    }
    if (!/^\d{9}$/.test(number)) {
      showError(AUTH_HINTS.needNineDigits);
      return;
    }
    if (!password) {
      showError(AUTH_HINTS.needPassword);
      return;
    }
    let account;
    try {
      account = resolveAccount();
    } catch (error) {
      showError(friendlyAuthError(error));
      return;
    }
    setNotice("");
    setNoticeOk(false);
    setBusy(true);
    try {
      const signedIn = await login({ email: account.email, password });
      if (!signedIn) {
        // Email not confirmed — AppContext routes them to the code screen
        return;
      }
      if (rememberMe) {
        await rememberLoginEmail(account.studentNumber);
      } else {
        await forgetLoginEmail();
      }
      // Offer the biometric app lock (no password is stored)
      await promptEnableAfterLogin();
    } catch (error) {
      showError(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot() {
    if (!String(studentNumber).trim()) {
      showError(AUTH_HINTS.forgotNeedNumber);
      return;
    }
    let account;
    try {
      account = resolveAccount();
    } catch (error) {
      showError(friendlyAuthError(error));
      return;
    }
    setNotice("");
    setNoticeOk(false);
    setBusy(true);
    try {
      await resetPassword(account.email);
      // Same message either way — we do not tell strangers if an account exists.
      showSuccess(AUTH_HINTS.resetSent);
    } catch (error) {
      showError(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthBackdrop>
      <ScrollView
        style={{ flex: 1, minHeight: 0, backgroundColor: "transparent" }}
        contentContainerStyle={styles.screenContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <View style={styles.brandHero}>
          <Image source={UJ_LOGO} style={styles.ujLogo} resizeMode="contain" />
          <View style={styles.wordmarkRow}>
            <Text style={styles.appTitleWhite}>U</Text>
            <Text style={[styles.appTitleAccent, { color: colors.accent }]}>FITNESS</Text>
          </View>
          <Text style={styles.brandLine}>Campus fitness. One account.</Text>
        </View>

        <View style={styles.photoAir} />

        <GlassSheet>
          <Text style={styles.cardSubtitle}>
            9-digit UJ student number. Train · eat · connect.
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="school-outline" size={20} color={colors.accent} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="9-digit student number"
              placeholderTextColor="#8A8A8A"
              value={studentNumber}
              onChangeText={(value) => setStudentNumber(value.replace(/\D/g, "").slice(0, 9))}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={9}
              autoComplete="username"
              textContentType="username"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.accent} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor="#8A8A8A"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
            />
          </View>

          <View style={styles.rowContainer}>
            <TouchableOpacity style={styles.rememberMeRow} onPress={() => setRememberMe(!rememberMe)}>
              <View
                style={[
                  styles.checkbox,
                  rememberMe && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                {rememberMe ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgot} disabled={busy}>
              <Text style={[styles.forgotText, { color: colors.accentBright || colors.accent }]}>Forgot?</Text>
            </TouchableOpacity>
          </View>

          {notice ? (
            <View
              style={[
                styles.notice,
                noticeOk ? styles.noticeOk : styles.noticeErr,
              ]}
            >
              <Text style={[styles.noticeText, noticeOk ? styles.noticeOkText : null]}>
                {notice}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.whiteCta} onPress={handleLogin} disabled={busy} activeOpacity={0.9}>
            {busy ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <>
                <Text style={styles.whiteCtaText}>Sign in</Text>
                <View style={[styles.ctaArrow, { backgroundColor: colors.accent }]}>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.noAccountText}>or </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.registerLink, { color: colors.accentBright || colors.accent }]}>Create account</Text>
            </TouchableOpacity>
          </View>
        </GlassSheet>
      </ScrollView>
    </AuthBackdrop>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 36,
    justifyContent: "flex-end",
  },
  brandHero: {
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  ujLogo: {
    width: 56,
    height: 56,
    marginBottom: 4,
  },
  wordmarkRow: {
    flexDirection: "row",
  },
  appTitleWhite: {
    ...display,
    fontSize: 42,
    letterSpacing: 1.5,
    color: "#FFFFFF",
  },
  appTitleAccent: {
    ...display,
    fontSize: 42,
    letterSpacing: 1.5,
  },
  brandLine: {
    fontSize: 14,
    color: "rgba(255,255,255,0.62)",
    marginTop: 2,
  },
  photoAir: {
    flexGrow: 1,
    minHeight: 160,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#C9C9C9",
    lineHeight: 20,
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: radius.input,
    paddingHorizontal: 14,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#FFFFFF",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  rememberText: {
    fontSize: 14,
    marginLeft: 8,
    color: "#C9C9C9",
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "700",
  },
  notice: {
    borderWidth: 1,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  noticeErr: {
    backgroundColor: "rgba(255,106,0,0.16)",
    borderColor: "rgba(255,106,0,0.45)",
  },
  noticeOk: {
    backgroundColor: "rgba(46,160,67,0.18)",
    borderColor: "rgba(46,160,67,0.5)",
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFB27A",
  },
  noticeOkText: {
    color: "#9BE39B",
  },
  whiteCta: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  whiteCtaText: {
    color: "#0A0A0A",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  ctaArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  noAccountText: {
    fontSize: 14,
    color: "#C9C9C9",
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "800",
  },
});
