import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { fetchRemoteProfile, saveRemoteProfile, resolveProfileForUser } from '../lib/cloudProfile';
import { recommendPrograms } from '../data/recommend';
import { toDateKey, getWeekDays } from '../data/week';
import { exercises as localExercises } from '../data/exercises';
import {
  FALLBACK_BODY_PARTS,
  loadExerciseCatalog,
  loadExercisesByBodyPart,
  lookupExercise,
  saveRapidApiKey,
  searchExerciseDb,
  getRapidApiKey,
} from '../lib/exercisedb';
import { FLOOR_PLAN } from '../data/floorPlan';
import { getTodayPlan } from '../data/planEngine';
import { applyMainProfileSeed } from '../lib/seedFromMain';
import { defaultTrainWeekdays, resolveTrainWeekdays } from '../lib/trainDays';
import { useApp as useMainApp } from '../../../context/AppContext';

const STORAGE_KEY = 'workoutapp.profile.v1';

const defaultProfile = {
  onboarded: true,
  gender: '',
  weightKg: 75,
  campus: 'APK',
  daysPerWeek: 3,
  trainWeekdays: [],
  goal: null,
  equipmentTier: 'bodyweight',
  experience: 'new',
  musicPlatform: 'spotify',
  musicLinks: {},
  musicAutoOpen: false,
  injuries: [],
  planStartedAt: new Date().toISOString(),
  acceptedDisclaimer: true,
  completedExerciseIds: [],
  history: [],
  favorites: [],
  customWorkouts: [],
  lastSets: {},
};

function migrateProfile(parsed) {
  const next = {
    ...defaultProfile,
    ...parsed,
    history: parsed.history || [],
    injuries: parsed.injuries || [],
    daysPerWeek: parsed.trainWeekdays?.length || parsed.daysPerWeek || 3,
    trainWeekdays: parsed.trainWeekdays?.length ? parsed.trainWeekdays : defaultTrainWeekdays(parsed.daysPerWeek || 3),
    campus: parsed.campus || '',
    completedExerciseIds: parsed.completedExerciseIds || [],
    favorites: parsed.favorites || [],
    customWorkouts: parsed.customWorkouts || [],
    lastSets: parsed.lastSets || {},
    goal: parsed.goal || null,
    equipmentTier: parsed.equipmentTier || 'bodyweight',
    experience: parsed.experience || 'new',
    musicPlatform: parsed.musicPlatform || 'spotify',
    musicLinks: parsed.musicLinks || {},
    musicAutoOpen: parsed.musicAutoOpen ?? false,
    gender: parsed.gender || '',
    planVersion: 2,
  };
  if (next.onboarded && !next.planStartedAt) {
    next.planStartedAt = new Date().toISOString();
  }
  next.onboarded = true;
  next.acceptedDisclaimer = true;
  return next;
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { uid } = useAuth();
  const { profile: mainProfile } = useMainApp();
  const [profile, setProfile] = useState(defaultProfile);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState('idle');
  const syncedUid = useRef(null);
  const previousUid = useRef(null);
  const pushTimer = useRef(null);
  const [catalog, setCatalog] = useState(localExercises);
  const [catalogSource, setCatalogSource] = useState('local');
  const [catalogError, setCatalogError] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [bodyParts, setBodyParts] = useState(FALLBACK_BODY_PARTS);
  const [hasApiKey, setHasApiKey] = useState(false);

  const refreshCatalog = useCallback(async (key) => {
    setCatalogLoading(true);
    const result = await loadExerciseCatalog(key);
    setCatalog(result.catalog);
    setCatalogSource(result.source);
    setCatalogError(result.error);
    setBodyParts(result.bodyParts || FALLBACK_BODY_PARTS);
    setHasApiKey(Boolean(result.hasKey));
    setCatalogLoading(false);
    return result;
  }, []);

  const connectExerciseDb = useCallback(async (key) => {
    const saved = await saveRapidApiKey(key);
    return refreshCatalog(saved);
  }, [refreshCatalog]);

  const searchRemote = useCallback(async (query) => {
    const key = await getRapidApiKey();
    const rows = await searchExerciseDb(query, key);
    setCatalog((prev) => {
      const ids = new Set(prev.map((item) => item.id));
      return [...prev, ...rows.filter((item) => !ids.has(item.id))];
    });
    return rows;
  }, []);

  const loadBodyPart = useCallback(async (part) => {
    const key = await getRapidApiKey();
    const rows = await loadExercisesByBodyPart(part, key);
    setCatalog((prev) => {
      const ids = new Set(prev.map((item) => item.id));
      return [...prev, ...rows.filter((item) => !ids.has(item.id))];
    });
    return rows;
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw);
          const migrated = migrateProfile(parsed);
          setProfile(migrated);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)).catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    getRapidApiKey().then((key) => {
      setHasApiKey(Boolean(key));
      refreshCatalog(key);
    });
  }, []);

  // Signing out leaves the device clean: the account's data stays in the cloud and comes back
  // on the next sign-in, so the next person to open the app does not see someone else's history.
  useEffect(() => {
    if (!ready) return;
    if (previousUid.current && !uid) {
      setProfile(defaultProfile);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile)).catch(() => {});
      setSyncState('idle');
    }
    previousUid.current = uid;
  }, [uid, ready]);

  // Pull the account's profile once per sign-in, folding in anything logged as a guest.
  useEffect(() => {
    if (!ready) return;
    if (!uid) {
      syncedUid.current = null;
      setSyncState('idle');
      return;
    }
    if (syncedUid.current === uid) return;
    syncedUid.current = uid;

    let active = true;
    setSyncState('syncing');
    fetchRemoteProfile(uid)
      .then(async (remoteProfile) => {
        if (!active) return;
        const resolved = resolveProfileForUser({ localProfile: profile, remoteProfile, uid });
        const next = { ...resolved, updatedAt: new Date().toISOString() };
        setProfile(next);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        await saveRemoteProfile(uid, next);
        if (active) setSyncState('synced');
      })
      .catch(() => {
        if (active) setSyncState('error');
      });

    return () => {
      active = false;
    };
  }, [uid, ready]);

  useEffect(
    () => () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    },
    []
  );

  const persist = (next) => {
    const stamped = { ...next, updatedAt: new Date().toISOString(), ownerUid: uid || next.ownerUid || null };
    setProfile(stamped);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stamped)).catch(() => {});

    if (!uid) return;
    // Batch rapid edits (steppers, toggles) into one write.
    if (pushTimer.current) clearTimeout(pushTimer.current);
    setSyncState('syncing');
    pushTimer.current = setTimeout(() => {
      saveRemoteProfile(uid, stamped)
        .then(() => setSyncState('synced'))
        .catch(() => setSyncState('error'));
    }, 1200);
  };

  useEffect(() => {
    if (!ready) return;
    const patch = applyMainProfileSeed(mainProfile, profile);
    if (!patch) return;
    persist({ ...profile, ...patch });
  }, [
    ready,
    mainProfile?.fitnessGoal,
    mainProfile?.campus,
    mainProfile?.experienceLevel,
    mainProfile?.workoutPreference,
    mainProfile?.gender,
    mainProfile?.daysPerWeek,
  ]);

  const value = useMemo(() => {
    const todayPlan = getTodayPlan(profile) || {
      type: 'rest',
      week: 1,
      moves: [],
      status: 'uFitness is ready.',
      session: null,
    };
    const todayMoves = todayPlan.moves || [];
    const completedIds = profile.completedExerciseIds || [];
    const todayDone = todayMoves.filter((move) => completedIds.includes(move.id)).length;
    const history = profile.history || [];
    const weekKeys = new Set(getWeekDays().map((item) => item.key));
    const weekDone = new Set(history.filter((item) => weekKeys.has(item.date)).map((item) => item.date)).size;
    const weekTotal = resolveTrainWeekdays(profile).length;

    return {
      ready,
      profile,
      syncState,
      plan: FLOOR_PLAN,
      program: todayPlan.program || null,
      todayPlan,
      todayProgram: {
        id: FLOOR_PLAN.id,
        name: todayPlan.session?.name || FLOOR_PLAN.name,
        exerciseIds: todayMoves.map((move) => move.id),
      },
      todayDone,
      todayTotal: todayMoves.length || 1,
      weekDone: Math.min(weekDone, 7),
      weekTotal,
      insightPercent: Math.round((Math.min(weekDone, weekTotal) / weekTotal) * 100),
      statusSentence: todayPlan.status,
      recommendations: recommendPrograms(profile, 4),
      catalog,
      catalogSource,
      catalogError,
      catalogLoading,
      bodyParts,
      hasApiKey,
      refreshCatalog,
      connectExerciseDb,
      searchRemote,
      loadBodyPart,
      getExercise: (id) => lookupExercise(id, catalog),
      updateProfile: (patch) => persist({ ...profile, ...patch }),
      completeOnboarding: (patch = {}) =>
        persist({
          ...profile,
          ...patch,
          onboarded: true,
          acceptedDisclaimer: true,
          planStartedAt: patch.planStartedAt || profile.planStartedAt || new Date().toISOString(),
          planVersion: 2,
        }),
      acceptDisclaimer: () =>
        persist({
          ...profile,
          acceptedDisclaimer: true,
          planStartedAt: profile.planStartedAt || new Date().toISOString(),
          planVersion: 2,
        }),
      completeExercise: (exerciseId) => {
        if (profile.completedExerciseIds.includes(exerciseId)) return;
        persist({
          ...profile,
          completedExerciseIds: [...profile.completedExerciseIds, exerciseId],
        });
      },
      completeMany: (exerciseIds) => {
        const next = new Set(profile.completedExerciseIds);
        exerciseIds.forEach((id) => next.add(id));
        persist({ ...profile, completedExerciseIds: [...next] });
      },
      logSession: ({ exerciseIds, minutes, programId, sessionId, setsLog = [] }) => {
        const nextIds = new Set(profile.completedExerciseIds);
        exerciseIds.forEach((id) => nextIds.add(id));
        const lastSets = { ...(profile.lastSets || {}) };
        setsLog.forEach((entry) => {
          const last = (entry.sets || [])[entry.sets.length - 1];
          if (last) lastSets[entry.id] = { reps: last.reps, weightKg: last.weightKg || 0 };
        });
        persist({
          ...profile,
          completedExerciseIds: [...nextIds],
          lastSets,
          history: [
            {
              id: `${Date.now()}`,
              date: toDateKey(),
              exerciseIds,
              minutes,
              programId: programId || FLOOR_PLAN.id,
              sessionId,
              setsLog,
            },
            ...history,
          ].slice(0, 60),
        });
      },
      toggleFavorite: (exerciseId) => {
        const current = profile.favorites || [];
        const next = current.includes(exerciseId)
          ? current.filter((id) => id !== exerciseId)
          : [...current, exerciseId];
        persist({ ...profile, favorites: next });
      },
      setMusicPlatform: (platform) => persist({ ...profile, musicPlatform: platform }),
      saveMusicLink: (platform, url) =>
        persist({
          ...profile,
          musicLinks: { ...(profile.musicLinks || {}), [platform]: (url || '').trim() },
        }),
      setMusicAutoOpen: (value) => persist({ ...profile, musicAutoOpen: Boolean(value) }),
      saveCustomWorkout: ({ name, exerciseIds }) => {
        if (!exerciseIds?.length) return;
        persist({
          ...profile,
          customWorkouts: [
            {
              id: `custom-${Date.now()}`,
              name: name || 'My workout',
              exerciseIds,
              createdAt: new Date().toISOString(),
            },
            ...(profile.customWorkouts || []),
          ].slice(0, 20),
        });
      },
      deleteCustomWorkout: (id) =>
        persist({
          ...profile,
          customWorkouts: (profile.customWorkouts || []).filter((item) => item.id !== id),
        }),
      resetProgress: () =>
        persist({ ...profile, completedExerciseIds: [], history: [], lastSets: {} }),
    };
  }, [profile, ready, syncState, uid, catalog, catalogSource, catalogError, catalogLoading, bodyParts, hasApiKey, refreshCatalog, connectExerciseDb, searchRemote, loadBodyPart]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
