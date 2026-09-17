// screens/auth/LoginScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { logIn } from '../../services/authService';

// Props: onNavigateToSignUp: () => void
export default function LoginScreen({ onNavigateToSignUp, errorMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (errorMessage) {
      Alert.alert('Profile unavailable', errorMessage);
    }
  }, [errorMessage]);

  const handleLogIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await logIn(email.trim(), password);
      // No navigation needed here - RootNavigator's auth listener will
      // detect the signed-in user and switch to the main app.
    } catch (error) {
      Alert.alert('Log in failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome back</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="jane@student.uj.ac.za"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

      <Pressable style={styles.button} onPress={handleLogIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
      </Pressable>

      <Pressable onPress={onNavigateToSignUp} style={styles.linkRow}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#F7F7F8' },
  title: { fontSize: 26, fontWeight: '700', color: '#1a1a1a', marginBottom: 24, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 12, marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  linkRow: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#FF6B35', fontWeight: '600', fontSize: 13 },
});
