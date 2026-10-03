import { useState } from "react";
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
import { friendlyAuthError } from "../../lib/authErrors";
import { accountFromStudentOrEmail, personName } from "../../lib/ujEmail";
import AuthBackdrop, { GlassSheet } from "./AuthBackdrop";
import { Ionicons } from "@expo/vector-icons";

const UJ_LOGO = require("../../../assets/uj-gym-logo.png");


//introduce the register screen
/**
 * The register screen is the first screen that the user sees when they open the app.
 * It allows the user to create a new account.
 * @param {Object} navigation - The navigation object.
 * @returns {React.ReactNode} - The register screen.
 */

export default function RegisterScreen({ navigation }) {
  const { register } = useApp();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [legal, setLegal] = useState("");


  //introduce the email hint
  /**
   * The email hint is the email address that the user will receive the code to.
   * @type {string}
   */

  let account = null;
  let emailHint = "";
  try {
    account = accountFromStudentOrEmail(studentNumber);
    emailHint = account.email;
  } catch {
    account = null;
    emailHint = "";
  }

  //introduce the handle register function
  /**
   * The handle register function is the function that is called when the user taps the create account button.
   * It registers the user with the app.
   * @returns {Promise<void>} - The promise that is returned when the user taps the create account button.
   */
  const handleRegister = async () => {
    setNotice("");
    if (!personName(fullName)) {
      setNotice("Enter your name. A student number is not a name.");
      return;
    }
    if (!/^\d{9}$/.test(String(studentNumber).trim())) {
      setNotice("Enter your 9-digit UJ student number.");
      return;
    }
    if (password.length < 8) {
      setNotice("Passwords need at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setNotice("Those passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const account = accountFromStudentOrEmail(studentNumber);
      await register({
        name: fullName,
        email: account.email,
        studentNumber: account.studentNumber,
        password,
      });
    } catch (error) {
      setNotice(friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

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
