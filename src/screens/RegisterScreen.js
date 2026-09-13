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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      return Alert.alert("Please fill in all fields.");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Passwords do not match!");
    }
    if (password.length < 6) {
      return Alert.alert("Password must be at least 6 characters.");
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        campus: '', 
        goal: '',   
        level: '',  
        createdAt: serverTimestamp()
      });

      // No manual navigation here! App.js will detect the new user and teleport them automatically.
      
    } catch (error) {
      console.error(error);
      Alert.alert("Registration Error", error.message);
      setLoading(false); 
    } 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />
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
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      
      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginVertical: 20 }} />
      ) : (
        <PrimaryButton title="Register" onPress={handleRegister} />
      )}

      <TouchableOpacity onPress={() => navigation.navigate("Login")} disabled={loading}>
        <Text style={styles.linkText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#f9f9f9" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 32, color: "#2E7D32" },
  input: { backgroundColor: "#fff", padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: "#ddd" },
  linkText: { textAlign: "center", marginTop: 20, color: "#2E7D32", fontSize: 16, fontWeight: "500" },
});