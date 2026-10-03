import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ActiveSessionContext = createContext(null);

export function ActiveSessionProvider({ children }) {
  const [session, setSession] = useState(null);

  const startSession = useCallback((data) => {
    setSession({ startedAt: Date.now(), movesDone: 0, state: 'Live', ...data });
  }, []);

  const updateSession = useCallback((patch) => {
    setSession((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const endSession = useCallback(() => setSession(null), []);

  const value = useMemo(
    () => ({ session, startSession, updateSession, endSession }),
    [session, startSession, updateSession, endSession]
  );

  return <ActiveSessionContext.Provider value={value}>{children}</ActiveSessionContext.Provider>;
}

export function useActiveSession() {
  return useContext(ActiveSessionContext);
}
