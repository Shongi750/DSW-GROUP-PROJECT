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

const UJ_LOGO = require("../../../assets/uj-gym-logo.png");
import { friendlyAuthError } from "../../lib/authErrors";
import { accountFromStudentOrEmail } from "../../lib/ujEmail";
import { forgetLoginEmail, recallLoginEmail, rememberLoginEmail } from "../../lib/rememberLogin";
import {
  biometricLabel,
  canUseBiometrics,
  isUnlockEnabled,
  promptEnableAfterLogin,
  unlockCredentials,
} from "../../lib/biometrics";

export default function LoginScreen({ navigation }) {
  const { login, resetPassword } = useApp();
  const { colors } = useTheme();
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [bioLabel, setBioLabel] = useState("");

  useEffect(() => {
    recallLoginEmail().then((saved) => {
      if (!saved) return;
      setStudentNumber(saved);
      setRememberMe(true);
    });
    Promise.all([canUseBiometrics(), isUnlockEnabled(), biometricLabel()]).then(
      ([can, on, label]) => {
        if (can && on) setBioLabel(label);
      }
    );
  }, []);

  const resolveAccount = () => accountFromStudentOrEmail(studentNumber);

  const handleLogin = async () => {
    if (!String(studentNumber).trim() || !password) {
      return setNotice("Enter your 9-digit student number and password.");
    }
    let account;
    try {
      account = resolveAccount();
    } catch (error) {
      return setNotice(error.message);
    }
    setNotice("");
    setBusy(true);
    try {
      const signedIn = await login({ email: account.email, password });
      if (!signedIn) return;
      if (rememberMe) await rememberLoginEmail(account.studentNumber);
      else await forgetLoginEmail();
      await promptEnableAfterLogin({ email: account.email, password });
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!String(studentNumber).trim()) {
      return setNotice("Enter your 9-digit student number first.");
    }
    let account;
    try {
      account = resolveAccount();
    } catch (error) {
      return setNotice(error.message);
    }
    setNotice("");
    setBusy(true);
    try {
      await resetPassword(account.email);
      // Do not confirm whether the account exists.
      setNotice("If that student number has an account, a reset link was sent to the matching UJ inbox.");
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleBiometric = async () => {
    setNotice("");
    setBusy(true);
    try {
      const creds = await unlockCredentials();
      if (!creds?.email || !creds.password) {
        return setNotice("Sign in with your student number and password once before biometric unlock can be used.");
      }
      await login({ email: creds.email, password: creds.password });
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

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
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
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

          {bioLabel ? (
            <TouchableOpacity style={styles.bioButton} onPress={handleBiometric} disabled={busy}>
              <Ionicons name="finger-print" size={20} color={colors.accent} />
              <Text style={[styles.bioButtonText, { color: colors.accent }]}>Unlock with {bioLabel}</Text>
            </TouchableOpacity>
          ) : null}

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
    backgroundColor: "rgba(255,106,0,0.16)",
    borderColor: "rgba(255,106,0,0.45)",
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#FFB27A",
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
  bioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,106,0,0.55)",
    borderRadius: radius.pill,
    paddingVertical: 14,
    marginBottom: 14,
  },
  bioButtonText: {
    fontSize: 15,
    fontWeight: "700",
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
