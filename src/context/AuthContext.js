import React, { createContext, useMemo } from 'react';

export const AuthContext = createContext({
  state: { user: { name: 'Student', foodBudget: 450 } },
});

export function AuthProvider({ children, user }) {
  const value = useMemo(
    () => ({
      state: {
        user: user || { name: 'Student', foodBudget: 450 },
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
