import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator
} from "react-native";
import PrimaryButton from "../components/PrimaryButton";
import { supabase } from '../config/supabase'; // or wherever your supabase config is exported

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Please fill in all fields.");
    }
    
    setLoading(true);
    try {
      // THIS IS THE NEW SUPABASE CODE
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      
      if (error) throw error;
      
      // No manual navigation here! App.js will handle the routing.
    } catch (error) {
      console.error(error);
      Alert.alert("Login Failed", error.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>UFitness</Text>
      <Text style={styles.subtitle}>Sign In</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 20 }} />
      ) : (
        <PrimaryButton title="Login" onPress={handleLogin} />
      )}

      <TouchableOpacity onPress={() => navigation.navigate("Register")} disabled={loading}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#f9f9f9" },
  title: { fontSize: 36, fontWeight: "bold", textAlign: "center", marginBottom: 8, color: "#2E7D32" },
  subtitle: { fontSize: 22, textAlign: "center", marginBottom: 32, color: "#333" },
  input: { backgroundColor: "#fff", padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: "#ddd" },
  linkText: { textAlign: "center", marginTop: 20, color: "#2E7D32", fontSize: 16, fontWeight: "500" },
});