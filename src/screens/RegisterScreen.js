import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
} from "react-native";

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = () => {
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
    Alert.alert(
      "Account Created!",
      "Welcome to UFitness! Let's get you started.",
    );
    navigation.navigate("FitnessGoal");
  };

  return (
    <View style={styles.screenContainer}>
      <Text style={styles.appTitle}>UFitness</Text>

      <Text style={styles.heading}>Create Account</Text>
      <Text style={styles.subheading}>
        Enter your details to join the UFitness platform.
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#70625B"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Student Number"
          placeholderTextColor="#70625B"
          value={studentNumber}
          onChangeText={setStudentNumber}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="University Email"
          placeholderTextColor="#70625B"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputWrapper}>
        <View style={styles.passwordInputRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#70625B"
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
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#70625B"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <Text style={styles.termsText}>
        By creating an account, you agree to the{" "}
        <Text style={styles.linkText}>Terms of Service</Text> and{" "}
        <Text style={styles.linkText}>Privacy Policy</Text>.
      </Text>

      <TouchableOpacity style={styles.createButton} onPress={handleRegister}>
        <Text style={styles.createButtonText}>Create Account →</Text>
      </TouchableOpacity>

      <View style={styles.loginRow}>
        <Text style={styles.haveAccountText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.loginLink}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: "600",
    color: "#8B4513",
    textAlign: "center",
    marginBottom: 40,
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
    marginBottom: 36,
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
    marginBottom: 36,
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
    marginBottom: 36,
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
