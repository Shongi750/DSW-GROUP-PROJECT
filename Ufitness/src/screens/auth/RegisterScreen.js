import { useEffect, useState } from "react";
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
  Modal,
  Image,
} from "react-native";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { friendlyAuthError, AUTH_HINTS } from "../../lib/authErrors";
import { accountFromStudentOrEmail } from "../../lib/ujEmail";
import { validateSignUp } from "../../lib/registerValidation";
import AuthBackdrop, { GlassSheet } from "./AuthBackdrop";
import { Ionicons } from "@expo/vector-icons";

const UJ_LOGO = require("../../../assets/uj-gym-logo.png");

// New UJ students: name + 9-digit number, then OTP goes to their student inbox.
export default function RegisterScreen({ navigation }) {
  const { register, registerDraft, clearRegisterDraft } = useApp();
  const { colors } = useTheme();
  // registerDraft = fields kept from the code screen ("Use a different email").
  const [fullName, setFullName] = useState(registerDraft?.name || "");
  const [studentNumber, setStudentNumber] = useState(registerDraft?.studentNumber || "");
  const [password, setPassword] = useState(registerDraft?.password || "");
  const [confirmPassword, setConfirmPassword] = useState(registerDraft?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [legal, setLegal] = useState("");

  // Fields are copied into state above, so the draft can be forgotten now.
  useEffect(() => {
    if (registerDraft) {
      setNotice("Fix your student number, then tap Sign up to get a new code.");
      clearRegisterDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Show where the 8-digit code will go once the student number is valid.
  let account = null;
  let emailHint = "";
  try {
    account = accountFromStudentOrEmail(studentNumber);
    emailHint = account.email;
  } catch {
    account = null;
    emailHint = "";
  }

  async function handleRegister() {
    setNotice("");
    // Same checks as before, now in lib/registerValidation.js so they can be tested.
    const check = validateSignUp({ fullName, studentNumber, password, confirmPassword });
    if (check.error) {
      setNotice(check.error);
      return;
    }
    setBusy(true);
    try {
      await register(check.account);
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
    <AuthBackdrop>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "transparent" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
    <ScrollView
      style={{ flex: 1, minHeight: 0, backgroundColor: "transparent" }}
      contentContainerStyle={styles.screenContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <View style={styles.brandTop}>
        <Image source={UJ_LOGO} style={styles.ujLogo} resizeMode="contain" />
        <View style={styles.wordmarkRow}>
          <Text style={[styles.appTitle, { color: "#FFFFFF" }]}>U</Text>
          <Text style={[styles.appTitle, { color: colors.accent }]}>FITNESS</Text>
        </View>
      </View>

      <View style={styles.photoAir} />

      <GlassSheet>
      <Text style={[styles.heading, { color: "#FFFFFF" }]}>Join campus fitness</Text>
      <Text style={[styles.subheading, { color: "#C9C9C9" }]}>
        UJ students only. We email an 8-digit code to your student inbox.
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)", color: "#FFFFFF" }]}
          placeholder="Your name"
          placeholderTextColor="#8A8A8A"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)", color: "#FFFFFF" }]}
          placeholder="9-digit student number"
          placeholderTextColor="#8A8A8A"
          value={studentNumber}
          onChangeText={(value) => setStudentNumber(value.replace(/\D/g, "").slice(0, 9))}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={9}
        />
        {emailHint ? (
          <Text style={[styles.derivedHint, { color: "#C9C9C9" }]}>
            Code goes to {emailHint} — only you can open that inbox.
          </Text>
        ) : null}
      </View>

      <View style={styles.inputWrapper}>
        <View style={[styles.passwordInputRow, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)" }]}>
          <TextInput
            style={[styles.passwordInput, { color: "#FFFFFF" }]}
            placeholder="Create a password"
            placeholderTextColor="#8A8A8A"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={[styles.eyeText, { color: colors.accent }]}>{showPassword ? "⊗" : "◉"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.14)", color: "#FFFFFF" }]}
          placeholder="Confirm password"
          placeholderTextColor="#8A8A8A"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
      </View>

      <Text style={[styles.termsText, { color: "#C9C9C9" }]}>
        By creating an account, you agree to the{" "}
        <Text style={[styles.linkText, { color: colors.accent }]} onPress={() => setLegal("terms")}>Terms of Service</Text> and{" "}
        <Text style={[styles.linkText, { color: colors.accent }]} onPress={() => setLegal("privacy")}>Privacy Policy</Text>.
      </Text>

      {notice ? (
        <View
          style={[
            styles.notice,
            {
              backgroundColor: "rgba(255,106,0,0.16)",
              borderColor: "rgba(255,106,0,0.45)",
            },
          ]}
        >
          <Text style={[styles.noticeText, { color: "#FFB27A" }]}>
            {notice}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.whiteCta} onPress={handleRegister} disabled={busy} activeOpacity={0.9}>
        {busy ? (
          <ActivityIndicator color="#0A0A0A" />
        ) : (
          <>
            <Text style={styles.whiteCtaText}>SIGN UP</Text>
            <View style={[styles.ctaArrow, { backgroundColor: colors.accent }]}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={[styles.haveAccountText, { color: "#C9C9C9" }]}>or </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={[styles.loginLink, { color: colors.accentBright || colors.accent }]}>Log in</Text>
        </TouchableOpacity>
      </View>
      </GlassSheet>
    </ScrollView>
    </KeyboardAvoidingView>
    </AuthBackdrop>
    <Modal visible={Boolean(legal)} animationType="slide" onRequestClose={() => setLegal("")}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48, backgroundColor: colors.background, flexGrow: 1 }}>
        <Text style={[styles.heading, { color: colors.text }]}>{legal === "privacy" ? "Privacy Policy" : "Terms of Service"}</Text>
        <Text style={[styles.subheading, { color: colors.text, marginTop: 12 }]}>
          {legal === "privacy"
            ? "UFitness stores your name, UJ student account, fitness setup, meals, workouts, and community posts in your Supabase account. Other students can see your name, campus, goal, and experience after you finish setup. They cannot see your student number, email, or password. Signing out keeps the cloud profile. Deleting the account removes that profile and the documents saved for your user id."
            : "UFitness is for University of Johannesburg students only. Sign up with your own 9-digit student number. The 8-digit email code proves you can open that student inbox. Do not share your password. Workout and meal suggestions are not medical advice. You can delete the account from Profile."}
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
          onPress={() => setLegal("")}
        >
          <Text style={styles.createButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 36,
    justifyContent: "flex-end",
  },
  brandTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ujLogo: {
    width: 52,
    height: 52,
  },
  wordmarkRow: {
    flexDirection: "row",
  },
  appTitle: {
    fontFamily: "Anton_400Regular",
    fontSize: 28,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  photoAir: {
    flexGrow: 1,
    minHeight: 80,
  },
  formCard: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  heading: {
    fontFamily: "Anton_400Regular",
    fontSize: 28,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    marginBottom: 18,
    lineHeight: 20,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  derivedHint: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
  },
  passwordInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
  },
  eyeButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  eyeText: {
    fontSize: 20,
    opacity: 0.9,
  },
  termsText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 16,
    lineHeight: 21,
  },
  linkText: {
    fontWeight: "700",
  },
  notice: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  noticeText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  whiteCta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
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
  createButton: {
    borderRadius: 999,
    paddingVertical: 19,
    alignItems: "center",
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  haveAccountText: {
    fontSize: 15,
  },
  loginLink: {
    fontSize: 15,
    fontWeight: "800",
  },
});
