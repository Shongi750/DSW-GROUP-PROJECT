import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateAuthProfile,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured, missingFirebaseKeys } from '../lib/firebase';
import { friendlyAuthError } from '../../../lib/authErrors';
import { assertUjStudentAccount } from '../../../lib/ujEmail';

const GUEST_KEY = 'workoutapp.guest.v1';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [guest, setGuest] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(GUEST_KEY)
      .then((value) => {
        if (active && value === 'true' && !isFirebaseConfigured) setGuest(true);
      })
      .catch(() => {})
      .finally(() => {
        if (!isFirebaseConfigured && active) setAuthReady(true);
      });

    if (!isFirebaseConfigured) return () => {
      active = false;
    };

    // If Firebase cannot answer (bad keys, no network on a cold start), fall through to the
    // sign-in screen instead of leaving the user on a spinner forever.
    const failsafe = setTimeout(() => {
      if (active) setAuthReady(true);
    }, 8000);

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (nextUser) => {
      if (!active) return;
      setUser(nextUser || null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      clearTimeout(failsafe);
      unsubscribe();
    };
  }, []);

  const run = useCallback(async (action) => {
    setBusy(true);
    try {
      await action();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: friendlyAuthError(error) };
    } finally {
      setBusy(false);
    }
  }, []);

  const signUp = useCallback(
    ({ email, password, name }) =>
      run(async () => {
        const account = assertUjStudentAccount({ email });
        const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), account.email, password);
        try {
          if (name?.trim()) await updateAuthProfile(credential.user, { displayName: name.trim() });
        } catch {}
        await AsyncStorage.removeItem(GUEST_KEY);
        setGuest(false);
        setUser(credential.user);
      }),
    [run]
  );

  const signIn = useCallback(
    ({ email, password }) =>
      run(async () => {
        const account = assertUjStudentAccount({ email });
        const credential = await signInWithEmailAndPassword(getFirebaseAuth(), account.email, password);
        await AsyncStorage.removeItem(GUEST_KEY);
        setGuest(false);
        setUser(credential.user);
      }),
    [run]
  );

  const resetPassword = useCallback(
    (email) =>
      run(async () => {
        const account = assertUjStudentAccount({ email });
        await sendPasswordResetEmail(getFirebaseAuth(), account.email);
      }),
    [run]
  );

  const signOut = useCallback(
    () =>
      run(async () => {
        await firebaseSignOut(getFirebaseAuth());
        await AsyncStorage.removeItem(GUEST_KEY);
        setGuest(false);
      }),
    [run]
  );

  const continueAsGuest = useCallback(async () => {
    await AsyncStorage.setItem(GUEST_KEY, 'true');
    setGuest(true);
  }, []);

  const value = useMemo(
    () => ({
      user,
      uid: user?.uid || null,
      email: user?.email || null,
      displayName: user?.displayName || null,
      guest,
      authReady,
      busy,
      authAvailable: isFirebaseConfigured,
      missingFirebaseKeys,
      signUp,
      signIn,
      signOut,
      resetPassword,
      continueAsGuest,
    }),
    [user, guest, authReady, busy, signUp, signIn, signOut, resetPassword, continueAsGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
