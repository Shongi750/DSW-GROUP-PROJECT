import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateAuthProfile,
} from 'firebase/auth';
import { groceryTotalFromList, remainingAfterGrocery, resolveWeeklyBudget } from '../features/meals/lib/budget';
import { EMPTY_DIET_FILTERS } from '../features/meals/lib/diet';
import { loadSavedPlan } from '../features/meals/lib/persist';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';
import { wipeLocalUfitnessData } from '../lib/wipeLocal';
import { forgetProfile, recallProfile, rememberProfile, setupLooksComplete } from '../lib/profileStore';
import { deleteCloudUser, fetchCloudUser, mergeCloudProfile, saveCloudUser } from '../lib/cloudUser';
import { assertUjStudentAccount, isCampusAdmin, studentNumberFromEmail } from '../lib/ujEmail';
import { friendlyAuthError } from '../lib/authErrors';
import {
  clearPendingSignup,
  completeAccountLink,
  currentHref,
  readPendingSignup,
  sendAccountLink,
  writePendingSignup,
} from '../lib/emailLink';

const STORAGE_KEY = 'ufitness.session.v1';
const GUEST_KEY = 'workoutapp.guest.v1';

const CAMPUS_FULL = {
  APK: 'APK (Auckland Park Kingsway)',
  APB: 'APB (Auckland Park Bunting Road)',
  DFC: 'DFC (Doornfontein)',
  SWC: 'SWC (Soweto)',
};

const emptyProfile = {
  userId: '',
  name: '',
  email: '',
  studentNumber: '',
  fitnessGoal: '',
  experienceLevel: '',
  workoutPreference: '',
  foodBudget: '',
  foodBudgetAmount: 1500,
  weeklyFoodBudget: 340,
  foodBudgetRemaining: 340,
  fundingType: '',
  campus: '',
  course: '',
  courseFaculty: '',
  yearOfStudy: '',
  gender: '',
  dietFilters: { ...EMPTY_DIET_FILTERS },
  daysPerWeek: 4,
  avatarUrl: '',
  onboardingComplete: false,
};

const AppContext = createContext(null);

async function readSavedSession() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { user: null, profile: emptyProfile };
  const saved = JSON.parse(raw);
  return {
    user: saved.user || null,
    profile: { ...emptyProfile, ...(saved.profile || {}) },
  };
}

async function persist(nextUser, nextProfile) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ user: nextUser, profile: nextProfile }),
  );
  await rememberProfile(nextUser, nextProfile);
  const uid = nextUser?.id || nextProfile?.userId;
  if (uid && setupLooksComplete(nextProfile)) {
    saveCloudUser(uid, nextProfile);
  }
}

function sameAccount(savedProfile, firebaseUser) {
  if (!savedProfile) return false;
  const email = String(firebaseUser?.email || savedProfile.email || '').toLowerCase();
  const savedEmail = String(savedProfile.email || '').toLowerCase();
  if (savedProfile.userId && firebaseUser?.uid && savedProfile.userId === firebaseUser.uid) return true;
  return Boolean(savedEmail && email && savedEmail === email);
}

async function profileForAuth(firebaseUser, savedProfile) {
  const remembered = await recallProfile({ uid: firebaseUser.uid, email: firebaseUser.email });
  const local =
    remembered ||
    (sameAccount(savedProfile, firebaseUser) ? savedProfile : emptyProfile);
  const remote = setupLooksComplete(local) ? null : await fetchCloudUser(firebaseUser.uid);
  const base = mergeCloudProfile(local, remote);
  const next = {
    ...base,
    userId: firebaseUser.uid,
    email: firebaseUser.email || base.email || '',
    name: base.name || firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : ''),
    studentNumber: base.studentNumber || studentNumberFromEmail(firebaseUser.email || base.email),
    onboardingComplete: setupLooksComplete(base),
  };
  return next;
}

async function withBudget(nextProfile) {
  const mealPlan = await loadSavedPlan();
  const weekly = resolveWeeklyBudget(
    mealPlan?.budget,
    nextProfile.foodBudgetAmount,
    nextProfile.fundingType
  );
  const groceryTotal = groceryTotalFromList(mealPlan?.groceries);
  return {
    ...nextProfile,
    weeklyFoodBudget: weekly,
    foodBudgetRemaining: remainingAfterGrocery(weekly, groceryTotal),
  };
}

export function AppProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [emailVerified, setEmailVerified] = useState(!isFirebaseConfigured);
  const [verificationError, setVerificationError] = useState('');
  const [awaitingLink, setAwaitingLink] = useState(false);
  const pendingRef = useRef(null);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    const applyBudgeted = async (nextUser, nextProfile) => {
      const budgeted = await withBudget(nextProfile);
      if (!active) return;
      setUser(nextUser);
      setProfile(budgeted);
    };

    (async () => {
      try {
        const saved = await readSavedSession();
        const pendingSignup = await readPendingSignup();
        if (pendingSignup?.email) {
          setAwaitingLink(true);
          setProfile((prev) => ({
            ...emptyProfile,
            ...prev,
            name: pendingSignup.name || '',
            email: pendingSignup.email,
            studentNumber: pendingSignup.studentNumber || '',
          }));
        }
        if (!isFirebaseConfigured) {
          setEmailVerified(true);
          await applyBudgeted(saved.user, saved.profile);
          return;
        }

        const auth = getFirebaseAuth();
        try {
          const linked = await completeAccountLink(auth, currentHref());
          if (linked?.user) {
            const pending = linked.pending || pendingSignup || {};
            try {
              if (pending.name) await updateAuthProfile(linked.user, { displayName: pending.name });
            } catch {}
            const nextUser = { id: linked.user.uid, email: linked.user.email };
            const restored = await profileForAuth(linked.user, saved.profile);
            const nextProfile = {
              ...restored,
              name: restored.name || pending.name || linked.user.displayName || '',
              email: linked.user.email,
              studentNumber: restored.studentNumber || pending.studentNumber || studentNumberFromEmail(linked.user.email),
              onboardingComplete: setupLooksComplete(restored),
            };
            pendingRef.current = { user: nextUser, profile: nextProfile };
            setEmailVerified(true);
            setAwaitingLink(false);
            await clearPendingSignup();
            await persist(nextUser, nextProfile);
            await applyBudgeted(nextUser, nextProfile);
          }
        } catch (error) {
          setVerificationError(friendlyAuthError(error));
        }

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          try {
            if (!active) return;
            if (firebaseUser) {
              const pending = pendingRef.current;
              const savedNow = pending || (await readSavedSession());
              const nextUser = { id: firebaseUser.uid, email: firebaseUser.email || savedNow.profile.email };
              const nextProfile =
                pending?.profile || (await profileForAuth(firebaseUser, savedNow.profile));
              const verified = Boolean(firebaseUser.emailVerified);
              setEmailVerified(verified);
              if (verified) setAwaitingLink(false);
              await persist(nextUser, nextProfile);
              await applyBudgeted(nextUser, nextProfile);
              return;
            }
            setEmailVerified(false);
            const waiting = await readPendingSignup();
            if (waiting?.email) {
              setAwaitingLink(true);
              setUser(null);
              setProfile({
                ...emptyProfile,
                name: waiting.name || '',
                email: waiting.email,
                studentNumber: waiting.studentNumber || '',
              });
              return;
            }
            setAwaitingLink(false);
            setUser(null);
            setProfile(await withBudget(emptyProfile));
          } catch (error) {
            console.warn('Could not restore UFitness session', error);
          } finally {
            if (active) setBooting(false);
          }
        });
      } catch (error) {
        console.warn('Could not restore UFitness session', error);
        if (active) setBooting(false);
      } finally {
        if (!isFirebaseConfigured && active) setBooting(false);
      }
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    const account = assertUjStudentAccount({ email });
    if (isFirebaseConfigured) {
      const credential = await signInWithEmailAndPassword(getFirebaseAuth(), account.email, password);
      const saved = await readSavedSession();
      const nextUser = { id: credential.user.uid, email: credential.user.email || account.email };
      const nextProfile = await profileForAuth(credential.user, saved.profile);
      if (!nextProfile.studentNumber) nextProfile.studentNumber = account.studentNumber;
      pendingRef.current = { user: nextUser, profile: nextProfile };
      setEmailVerified(Boolean(credential.user.emailVerified));
      await persist(nextUser, nextProfile);
      const budgeted = await withBudget(nextProfile);
      setUser(nextUser);
      setProfile(budgeted);
      pendingRef.current = null;
      await AsyncStorage.removeItem(GUEST_KEY);
      return budgeted;
    }

    const nextUser = {
      id: profile.userId || `local-${account.email}`,
      email: account.email,
    };
    const nextProfile = {
      ...profile,
      userId: nextUser.id,
      email: account.email,
      studentNumber: profile.studentNumber || account.studentNumber,
      name: profile.name || account.studentNumber,
    };
    setEmailVerified(true);
    setUser(nextUser);
    setProfile(nextProfile);
    await persist(nextUser, nextProfile);
    return nextProfile;
  };

  const register = async ({ name, email, studentNumber, password }) => {
    const account = assertUjStudentAccount({ email, studentNumber });
    if (isFirebaseConfigured) {
      await writePendingSignup({
        name,
        email: account.email,
        studentNumber: account.studentNumber,
        password,
      });
      try {
        await sendAccountLink(getFirebaseAuth(), account.email);
        setVerificationError('');
      } catch (error) {
        setVerificationError(friendlyAuthError(error));
        throw error;
      }
      const nextProfile = {
        ...emptyProfile,
        name,
        email: account.email,
        studentNumber: account.studentNumber,
        onboardingComplete: false,
      };
      setUser(null);
      setProfile(nextProfile);
      setEmailVerified(false);
      setAwaitingLink(true);
      return nextProfile;
    }

    const nextUser = { id: `local-${account.email}`, email: account.email };
    const nextProfile = {
      ...emptyProfile,
      userId: nextUser.id,
      name,
      email: account.email,
      studentNumber: account.studentNumber,
      onboardingComplete: false,
    };
    setEmailVerified(true);
    setUser(nextUser);
    setProfile(nextProfile);
    await persist(nextUser, nextProfile);
    return nextProfile;
  };

  const resetPassword = async (email) => {
    const account = assertUjStudentAccount({ email });
    if (!isFirebaseConfigured) {
      throw new Error('Add EXPO_PUBLIC_FIREBASE_* to Ufitness/.env and restart Expo to reset a password.');
    }
    await sendPasswordResetEmail(getFirebaseAuth(), account.email);
  };

  const resendVerificationEmail = useCallback(async () => {
    const pending = await readPendingSignup();
    const email = pending?.email || getFirebaseAuth()?.currentUser?.email;
    if (!email) {
      throw new Error('Enter your UJ student email on Register, then we can send the link again.');
    }
    await sendAccountLink(getFirebaseAuth(), email);
    setAwaitingLink(true);
    setVerificationError('');
  }, []);

  const confirmEmailVerified = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return false;
    try {
      const linked = await completeAccountLink(auth, currentHref());
      if (linked?.user) {
        setEmailVerified(true);
        setAwaitingLink(false);
        return true;
      }
    } catch (error) {
      setVerificationError(friendlyAuthError(error));
    }
    const current = auth.currentUser;
    if (!current) return false;
    await current.reload();
    const verified = Boolean(auth.currentUser?.emailVerified);
    setEmailVerified(verified);
    if (verified) setAwaitingLink(false);
    return verified;
  }, []);

  const updateField = (field, value) => {
    setProfile((prev) => {
      const next = { ...prev, [field]: value };
      persist(user, next);
      return next;
    });
  };

  const updateFields = (patch) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      persist(user, next);
      return next;
    });
  };

  const completeOnboarding = async (patch = {}) => {
    setProfile((prev) => {
      const nextProfile = { ...prev, ...patch, onboardingComplete: true };
      persist(user, nextProfile);
      return nextProfile;
    });
  };

  const resetLocalSession = async ({ wipeAll = false } = {}) => {
    pendingRef.current = null;
    setUser(null);
    setProfile(emptyProfile);
    setEmailVerified(false);
    setVerificationError('');
    setAwaitingLink(false);
    if (wipeAll) {
      await forgetProfile(user, profile);
      await wipeLocalUfitnessData();
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(GUEST_KEY);
      await clearPendingSignup();
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch (error) {
        console.warn('Firebase sign out skipped', error?.message || error);
      }
    }
    await resetLocalSession();
  };

  const deleteAccount = async () => {
    if (isFirebaseConfigured) {
      const auth = getFirebaseAuth();
      const current = auth?.currentUser;
      if (current) {
        await deleteCloudUser(current.uid);
        try {
          await deleteUser(current);
        } catch (error) {
          if (error?.code === 'auth/requires-recent-login') {
            throw new Error('Sign in again, then delete the account. Firebase needs a recent login to remove it.');
          }
          throw new Error(friendlyAuthError(error));
        }
      }
    }
    await resetLocalSession({ wipeAll: true });
  };

  const currentStudent = useMemo(
    () => ({
      id: profile.userId || user?.id || 'guest',
      name: profile.name || 'Student',
      campus: profile.campus || 'APK',
      fitnessGoal: profile.fitnessGoal || 'General fitness',
      experienceLevel: profile.experienceLevel || 'Beginner',
      preferredSchedule: [],
      workoutLocation: profile.workoutPreference || 'Gym',
      course: profile.course,
      yearOfStudy: profile.yearOfStudy,
      gender: profile.gender,
      weeklyTarget: profile.daysPerWeek || 4,
      foodBudgetRemaining: profile.foodBudgetRemaining,
      avatarUrl: profile.avatarUrl,
    }),
    [profile, user],
  );

  const communityProfile = useMemo(
    () =>
      profile.name
        ? {
            name: profile.name,
            avatarUri: null,
            residenceCampus: CAMPUS_FULL[profile.campus] || CAMPUS_FULL.APK,
            studyCampus: CAMPUS_FULL[profile.campus] || CAMPUS_FULL.APK,
          }
        : null,
    [profile],
  );

  const value = {
    booting,
    user,
    profile,
    currentStudent,
    communityProfile,
    login,
    register,
    resetPassword,
    resendVerificationEmail,
    confirmEmailVerified,
    emailVerified,
    verificationError,
    awaitingLink,
    needsEmailVerification: Boolean(
      isFirebaseConfigured && ((awaitingLink && !user) || (user && !emailVerified))
    ),
    updateField,
    updateFields,
    completeOnboarding,
    logout,
    deleteAccount,
    canSeeCampusAdmin: isCampusAdmin({
      studentNumber: profile.studentNumber,
      email: profile.email || user?.email,
    }),
    authAvailable: isFirebaseConfigured,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
