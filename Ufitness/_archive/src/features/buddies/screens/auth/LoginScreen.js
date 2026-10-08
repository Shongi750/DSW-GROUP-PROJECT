// screens/auth/LoginScreen.js

import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { logIn } from '../../services/authService';
import { useTheme } from '../../../../context/ThemeContext';

const display = { fontFamily: 'Anton_400Regular', letterSpacing: 0.8 };

// Props: onNavigateToSignUp: () => void
export default function LoginScreen({ onNavigateToSignUp, errorMessage }) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
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
      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="jane@student.uj.ac.za"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={colors.muted}
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={handleLogIn} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
      </Pressable>

      <Pressable onPress={onNavigateToSignUp} style={styles.linkRow}>
        <Text style={styles.linkText}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors, isDark) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: colors.background },
    title: { ...display, fontSize: 28, color: colors.text, marginBottom: 24, textAlign: 'center', textTransform: 'uppercase' },
    label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 12, marginBottom: 8 },
    input: {
      backgroundColor: colors.input,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    button: {
      backgroundColor: colors.brand,
      borderRadius: 999,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 28,
    },
    buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
    linkRow: { marginTop: 16, alignItems: 'center' },
    linkText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  });
}
