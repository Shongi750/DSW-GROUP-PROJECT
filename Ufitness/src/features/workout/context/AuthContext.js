import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useApp as useMainApp } from '../../../context/AppContext';
import { friendlyAuthError } from '../../../lib/authErrors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const main = useMainApp();
  const [busy, setBusy] = useState(false);

  const user = main.user
    ? {
        uid: main.user.id,
        email: main.user.email || main.profile?.email || '',
        displayName: main.profile?.name || '',
      }
    : null;

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
      run(() => main.register({ email, password, name, studentNumber: '' })),
    [run, main]
  );

  const signIn = useCallback(
    ({ email, password }) => run(() => main.login({ email, password })),
    [run, main]
  );

  const resetPassword = useCallback(
    (email) => run(() => main.resetPassword(email)),
    [run, main]
  );

  const signOut = useCallback(() => run(() => main.logout()), [run, main]);

  const continueAsGuest = useCallback(async () => {}, []);

  const value = useMemo(
    () => ({
      user,
      uid: user?.uid || null,
      email: user?.email || null,
      displayName: user?.displayName || null,
      guest: false,
      authReady: !main.booting,
      busy,
      authAvailable: Boolean(user),
      signUp,
      signIn,
      signOut,
      resetPassword,
      continueAsGuest,
    }),
    [user, main.booting, busy, signUp, signIn, signOut, resetPassword, continueAsGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
