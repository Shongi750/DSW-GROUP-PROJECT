import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { friendlyAuthError } from "../../lib/authErrors";
import { assertUjStudentAccount, isUjStudentEmail, studentNumberFromEmail } from "../../lib/ujEmail";

export default function RegisterScreen({ navigation }) {
  const { register } = useApp();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState("Thabo Molefe");
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("ufitness123");
  const [confirmPassword, setConfirmPassword] = useState("ufitness123");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleRegister = async () => {
    if (
      !fullName ||
      !studentNumber ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return Alert.alert("Please fill in all fields.");
    }
    if (password !== confirmPassword) {
      return Alert.alert(
        "Passwords do not match.",
        "Please check your password.",
      );
    }
    if (password.length < 6) {
      return Alert.alert("Password too short", "Use at least 6 characters.");
    }
    try {
      assertUjStudentAccount({ email, studentNumber });
    } catch (error) {
      return Alert.alert("UJ student email required", error.message);
    }
    setBusy(true);
    try {
      await register({ name: fullName, email, studentNumber, password });
    } catch (error) {
      Alert.alert("Could not send sign-up link", friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
    <ScrollView
      style={{ flex: 1, minHeight: 0 }}
      contentContainerStyle={[styles.screenContainer, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <Text style={[styles.appTitle, { color: colors.brand }]}>UFitness</Text>

      <Text style={[styles.heading, { color: colors.text }]}>Create Account</Text>
      <Text style={[styles.subheading, { color: colors.muted }]}>
        We email a sign-up link to your UJ student address. Opening that link is the only way the account is created.
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
          placeholder="Full Name"
          placeholderTextColor={colors.muted}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
          placeholder="223222181"
          placeholderTextColor={colors.muted}
          value={studentNumber}
          onChangeText={(value) => {
            setStudentNumber(value);
            if (/^\d{8,9}$/.test(value.trim())) {
              setEmail(`${value.trim()}@student.uj.ac.za`);
            }
          }}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
          placeholder="223222181@student.uj.ac.za"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (isUjStudentEmail(value)) {
              setStudentNumber(studentNumberFromEmail(value));
            }
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputWrapper}>
        <View style={[styles.passwordInputRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <TextInput
            style={[styles.passwordInput, { color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeText}>{showPassword ? "⊗" : "◉"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.muted}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <Text style={[styles.termsText, { color: colors.muted }]}>
        By creating an account, you agree to the{" "}
        <Text style={styles.linkText}>Terms of Service</Text> and{" "}
        <Text style={styles.linkText}>Privacy Policy</Text>.
      </Text>

      <TouchableOpacity style={styles.createButton} onPress={handleRegister} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.createButtonText}>Create Account →</Text>
        )}
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={[styles.haveAccountText, { color: colors.muted }]}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginLink}>Log In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flexGrow: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 48,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "600",
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  heading: {
    fontSize: 40,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 17,
    color: "#665952",
    marginBottom: 16,
    lineHeight: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5D4CD",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 17,
    color: "#333333",
    backgroundColor: "#FFFFFF",
  },
  passwordInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5D4CD",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 17,
    color: "#333333",
  },
  eyeButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  eyeText: {
    fontSize: 20,
    color: "#8B4513",
    opacity: 0.75,
  },
  termsText: {
    fontSize: 15,
    color: "#5C4F47",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 16,
    lineHeight: 22,
  },
  linkText: {
    color: "#8B4513",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#8B4513",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  haveAccountText: {
    fontSize: 17,
    color: "#5C4F47",
  },
  loginLink: {
    fontSize: 17,
    color: "#8B4513",
    fontWeight: "700",
  },
});
