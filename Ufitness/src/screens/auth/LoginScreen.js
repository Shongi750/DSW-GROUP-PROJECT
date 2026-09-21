import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useApp } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { friendlyAuthError } from "../../lib/authErrors";
import { assertUjStudentAccount } from "../../lib/ujEmail";

export default function LoginScreen({ navigation }) {
  const { login, resetPassword } = useApp();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("ufitness123");
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Please fill in all fields.");
    }
    try {
      assertUjStudentAccount({ email });
    } catch (error) {
      return Alert.alert("UJ student email required", error.message);
    }
    setBusy(true);
    try {
      await login({ email, password });
    } catch (error) {
      Alert.alert("Could not sign in", friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      return Alert.alert("Enter your student email first.");
    }
    try {
      assertUjStudentAccount({ email });
    } catch (error) {
      return Alert.alert("UJ student email required", error.message);
    }
    setBusy(true);
    try {
      await resetPassword(email);
      Alert.alert("Check your email", "If that account exists, a reset link was sent.");
    } catch (error) {
      Alert.alert("Could not send reset email", friendlyAuthError(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, minHeight: 0, backgroundColor: colors.background }}
      contentContainerStyle={[styles.screenContainer, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      {/* Top Logo & Title */}
      <View style={styles.headerSection}>
        <View style={styles.logoCircle}>
          <FontAwesome5 name="dumbbell" size={32} color="#FFFFFF" />
        </View>
        <Text style={[styles.appTitle, { color: colors.brand }]}>UFitness</Text>
      </View>

      {/* White Card Container */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
          Sign in with your UJ student email (student number@student.uj.ac.za).
        </Text>

        {/* Email Input with Professional Icon */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons
            name="mail-outline"
            size={22}
            color="#8B4513"
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="223222181@student.uj.ac.za"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password Input with Professional Icon */}
        <View style={[styles.inputWrapper, { backgroundColor: colors.input, borderColor: colors.border }]}>
          <Ionicons
            name="lock-closed-outline"
            size={22}
            color="#8B4513"
            style={styles.inputIcon}
          />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Password"
            placeholderTextColor={colors.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Remember Me + Forgot Password */}
        <View style={styles.rowContainer}>
          <TouchableOpacity
            style={styles.rememberMeRow}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View
              style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
            >
              {rememberMe && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <Text style={[styles.rememberText, { color: colors.muted }]}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgot} disabled={busy}>
            <Text style={[styles.forgotText, { color: colors.brand }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerRow}>
          <Text style={[styles.noAccountText, { color: colors.muted }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flexGrow: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E67E45",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: "600",
    color: "#8B4513",
    letterSpacing: 0.5,
    marginTop: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 36,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 17,
    color: "#665952",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5D4CD",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#333333",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  rememberMeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: "#C4A89C",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  checkboxChecked: {
    backgroundColor: "#8B4513",
    borderColor: "#8B4513",
  },
  rememberText: {
    fontSize: 15,
    color: "#5C4F47",
    marginLeft: 8,
  },
  forgotText: {
    fontSize: 15,
    color: "#8B4513",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#8B4513",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#8B4513",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  noAccountText: {
    fontSize: 16,
    color: "#5C4F47",
  },
  registerLink: {
    fontSize: 16,
    color: "#2E4A7D",
    fontWeight: "700",
  },
});
