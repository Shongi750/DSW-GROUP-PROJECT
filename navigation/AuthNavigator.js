// navigation/AuthNavigator.js
//
// Simple two-screen flow for signed-out users. Uses local state instead of
// a stack navigator since it's just a toggle between Login and Sign Up.

import React, { useState } from 'react';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';

export default function AuthNavigator({ errorMessage }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'

  return mode === 'login' ? (
    <LoginScreen onNavigateToSignUp={() => setMode('signup')} errorMessage={errorMessage} />
  ) : (
    <SignUpScreen onNavigateToLogin={() => setMode('login')} />
  );
}
