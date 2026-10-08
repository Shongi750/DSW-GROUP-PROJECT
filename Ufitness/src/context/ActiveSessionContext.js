import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Holds the workout that is currently running (or paused).
// Lives above the Workout tab so the orange pill on Home still works.
const ActiveSessionContext = createContext(null);

// Same key every time so we can reload after the app restarts
const STORAGE_KEY = 'ufitness.workout.live.v1';

// Read whatever we saved last time (or null)
async function readLive() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// Save the live session, or clear it when the workout ends
async function writeLive(session) {
  try {
    if (!session) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    // storage failed — not the end of the world, pill just won't survive a restart
  }
}

export function ActiveSessionProvider({ children }) {
  const [session, setSession] = useState(null);

  // On first load, check if they minimized a workout earlier
  useEffect(() => {
    readLive().then(function (saved) {
      if (saved && saved.resume) {
        setSession(saved);
      }
    });
  }, []);

  // Called when the Player screen opens
  function startSession(data) {
    const next = {
      startedAt: Date.now(),
      movesDone: 0,
      state: 'Live',
      minimized: false,
      title: data && data.title ? data.title : 'Workout',
      movesTotal: data && data.movesTotal ? data.movesTotal : 0,
      currentMove: data && data.currentMove ? data.currentMove : '',
    };
    // copy any extra fields the Player sent
    if (data) {
      for (const key in data) {
        next[key] = data[key];
      }
    }
    setSession(next);
    writeLive(next);
  }

  // Small updates while they train (move name, rest, etc.)
  function updateSession(patch) {
    setSession(function (prev) {
      if (!prev) return prev;
      const next = Object.assign({}, prev, patch);
      writeLive(next);
      return next;
    });
  }

  // They pressed minimize — keep the snapshot so we can come back
  function minimizeSession(resume) {
    setSession(function (prev) {
      if (!prev) return prev;
      const next = Object.assign({}, prev, {
        minimized: true,
        state: 'Paused',
        resume: resume || prev.resume || null,
      });
      writeLive(next);
      return next;
    });
  }

  // Workout finished or cancelled
  function endSession() {
    setSession(null);
    writeLive(null);
  }

  const value = {
    session: session,
    startSession: startSession,
    updateSession: updateSession,
    minimizeSession: minimizeSession,
    endSession: endSession,
  };

  return (
    <ActiveSessionContext.Provider value={value}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

export function useActiveSession() {
  return useContext(ActiveSessionContext);
}
