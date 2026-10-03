import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { groceryTotalFromList, remainingAfterGrocery, resolveWeeklyBudget } from '../features/meals/lib/budget';
import { EMPTY_DIET_FILTERS } from '../features/meals/lib/diet';
import { loadSavedPlan } from '../features/meals/lib/persist';
import { authError, isSupabaseConfigured, supabase } from '../lib/supabase';
import { setCurrentUid } from '../lib/cloudCache';
import { wipeLocalUfitnessData } from '../lib/wipeLocal';
import { forgetProfile, recallProfile, rememberProfile, setupLooksComplete } from '../lib/profileStore';
import { deleteCloudUser, fetchCloudUser, mergeCloudProfile, saveCloudUser } from '../lib/cloudUser';
import { assertUjStudentAccount, isCampusAdmin, personName, studentNumberFromEmail } from '../lib/ujEmail';
import { markSignedOut, preferSignUp } from '../lib/authEntry';
import { disableUnlock, shouldLockSession } from '../lib/biometrics';
import { pingDailyUsage } from '../lib/usagePing';
import { clearPendingSignup, currentHref } from '../lib/emailLink';
import { capabilitiesFor, isMentorRole, normalizeRoles, ROLES, withRole } from '../lib/roles';

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
  /** One account, many roles — always includes student; mentor unlocks Mentor Hub. */
  roles: [ROLES.STUDENT],
  /** Privacy / visibility preferences */
  privacy: {
    discoverable: true,
    showGoal: true,
    showCampus: true,
    showExperience: true,
    shareProgressWithMentor: true,
    appearAsMentor: true,
  },
  onboardingComplete: false,
};

const AppContext = createContext(null);

async function sendSignupCode(email, metadata) {
  const account = assertUjStudentAccount({ email });
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Add the Supabase URL and anon key in Ufitness/.env, then restart the app.');
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: account.email,
    options: {
      shouldCreateUser: true,
      data: metadata || undefined,
    },
  });
  if (error) throw new Error(authError(error));
  return account;
}

async function readSavedSession() {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { user: null, profile: emptyProfile };
  const saved = JSON.parse(raw);
  return {
    user: saved.user || null,
    profile: { ...emptyProfile, ...(saved.profile || {}) },
  };
}

async function startLoggedOutIfRequested() {
  const href = currentHref();
  if (!/[?&](fresh|logout)=/.test(String(href || ''))) return false;
  try {
    if (supabase) await supabase.auth.signOut();
  } catch {
    /* already signed out */
  }
  await AsyncStorage.multiRemove([STORAGE_KEY, GUEST_KEY]); // where do these keys come from?
  // STORAGE_KEY is the key for the user session
  // GUEST_KEY is the key for the guest session

  //
  await clearPendingSignup();
  await preferSignUp();
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.delete('fresh');
    url.searchParams.delete('logout');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
  return true;
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

function toAuthShape(sessionUser) {
  const meta = sessionUser?.user_metadata || {};
  return {
    uid: sessionUser.id,
    email: sessionUser.email || '',
    displayName: personName(meta.name || meta.full_name),
  };
}

function sameAccount(savedProfile, authUser) {
  if (!savedProfile) return false;
  const email = String(authUser?.email || savedProfile.email || '').toLowerCase();
  const savedEmail = String(savedProfile.email || '').toLowerCase();
  if (savedProfile.userId && authUser?.uid && savedProfile.userId === authUser.uid) return true;
  return Boolean(savedEmail && email && savedEmail === email);
}

async function profileForAuth(authUser, savedProfile) {
  const remembered = await recallProfile({ uid: authUser.uid, email: authUser.email });
  const local =
    remembered ||
    (sameAccount(savedProfile, authUser) ? savedProfile : emptyProfile);
  const remote = setupLooksComplete(local) ? null : await fetchCloudUser(authUser.uid);
  const base = mergeCloudProfile(local, remote);
  const next = {
    ...base,
    userId: authUser.uid,
    email: authUser.email || base.email || '',
    name: personName(base.name) || authUser.displayName || '',
    studentNumber: base.studentNumber || studentNumberFromEmail(authUser.email || base.email),
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
  const [emailVerified, setEmailVerified] = useState(true);
  const [verificationError, setVerificationError] = useState('');
  const [awaitingLink, setAwaitingLink] = useState(false);
  const [pendingOtp, setPendingOtp] = useState(null);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [serverAdmin, setServerAdmin] = useState(false);
  const pendingRef = useRef(null);
  const skipLockRef = useRef(false);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    const applyBudgeted = async (nextUser, nextProfile) => {
      const budgeted = await withBudget(nextProfile);
      if (!active) return;
      setUser(nextUser);
      setProfile(budgeted);
      if (nextUser?.id) pingDailyUsage(nextUser.id);
      if (nextUser && !skipLockRef.current && (await shouldLockSession())) {
        setSessionLocked(true);
      } else {
        setSessionLocked(false);
      }
      skipLockRef.current = false;
    };

    (async () => {
      try {
        await startLoggedOutIfRequested();
        await clearPendingSignup();
        const saved = await readSavedSession();
        if (!isSupabaseConfigured || !supabase) {
          setEmailVerified(true);
          setAwaitingLink(false);
          await applyBudgeted(saved.user, saved.profile);
          return;
        }

        const applySupabaseUser = async (sessionUser) => {
          if (!sessionUser) {
            setAwaitingLink(false);
            setUser(null);
            setProfile(await withBudget(emptyProfile));
            return;
          }
          const shaped = toAuthShape(sessionUser);
          const pending = pendingRef.current;
          const savedNow = pending || (await readSavedSession());
          const nextUser = { id: shaped.uid, email: shaped.email || savedNow.profile?.email };
          const nextProfile = pending?.profile || (await profileForAuth(shaped, savedNow.profile));
          if (!nextProfile.studentNumber) nextProfile.studentNumber = studentNumberFromEmail(nextUser.email);
          setEmailVerified(true);
          setAwaitingLink(false);
          setPendingOtp(null);
          await persist(nextUser, nextProfile);
          await applyBudgeted(nextUser, nextProfile);
        };

        const { data } = await supabase.auth.getSession();
        if (active) await applySupabaseUser(data.session?.user || null);

        const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
          if (!active) return;
          if (!session?.user) {
            if (event === 'SIGNED_OUT') {
              applySupabaseUser(null).catch((error) => {
                console.warn('Could not restore UFitness session', error);
              });
            }
            return;
          }
          applySupabaseUser(session.user).catch((error) => {
            console.warn('Could not restore UFitness session', error);
          });
        });
        unsubscribe = () => listener.subscription.unsubscribe();
      } catch (error) {
        console.warn('Could not restore UFitness session', error);
        if (active) setBooting(false);
      } finally {
        if (active) setBooting(false);
      }
    })();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    skipLockRef.current = true;
    setSessionLocked(false);
    const account = assertUjStudentAccount({ email });
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: account.email,
        password,
      });
      if (error) {
        if (/email not confirmed/i.test(error.message || '')) {
          setPendingOtp({ email: account.email });
          return null;
        }
        throw new Error(authError(error));
      }
      const shaped = toAuthShape(data.user);
      const saved = await readSavedSession();
      const nextUser = { id: shaped.uid, email: shaped.email || account.email };
      const nextProfile = await profileForAuth(shaped, saved.profile);
      if (!nextProfile.studentNumber) nextProfile.studentNumber = account.studentNumber;
      pendingRef.current = { user: nextUser, profile: nextProfile };
      setEmailVerified(true);
      setAwaitingLink(false);
      await persist(nextUser, nextProfile);
      const budgeted = await withBudget(nextProfile);
      setUser(nextUser);
      setProfile(budgeted);
      pendingRef.current = null;
      await AsyncStorage.removeItem(GUEST_KEY);
      pingDailyUsage(nextUser.id);
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
      name: personName(profile.name),
    };
    setEmailVerified(true);
    setUser(nextUser);
    setProfile(nextProfile);
    await persist(nextUser, nextProfile);
    return nextProfile;
  };

  const register = async ({ name, email, studentNumber, password }) => {
    const account = assertUjStudentAccount({ email, studentNumber });
    if (isSupabaseConfigured && supabase) {
      await sendSignupCode(account.email, { name, student_number: account.studentNumber });
      setPendingOtp({
        email: account.email,
        name,
        studentNumber: account.studentNumber,
        password,
      });
      return { needsOtp: true };
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
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Add the Supabase URL and anon key in Ufitness/.env, then restart the app.');
    }
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(account.email, { redirectTo });
    if (error) throw new Error(authError(error));
  };

  const resendVerificationEmail = useCallback(async () => {
    const email = pendingOtp?.email;
    if (!email) {
      throw new Error('Create the account again before asking for another code.');
    }
    await sendSignupCode(email);
  }, [pendingOtp]);

  const verifySignupCode = useCallback(async (code) => {
    const email = pendingOtp?.email;
    const token = String(code || '').replace(/\D/g, '');
    if (!isSupabaseConfigured || !supabase || !email) {
      throw new Error('Create the account again so we know which UJ email to check.');
    }
    if (token.length !== 8) {
      throw new Error('Enter the 8-digit code from your UJ email.');
    }
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw new Error(authError(error));
    if (!data.user) throw new Error('That code did not confirm the account. Request a new one.');
    if (pendingOtp.password) {
      const { error: passwordError } = await supabase.auth.updateUser({ password: pendingOtp.password });
      if (passwordError) throw new Error(authError(passwordError));
    }
    const shaped = toAuthShape(data.user);
    const saved = await readSavedSession();
    const nextUser = { id: shaped.uid, email: shaped.email || email };
    const nextProfile = await profileForAuth(shaped, {
      ...saved.profile,
      name: pendingOtp.name || saved.profile?.name || '',
      email,
      studentNumber: pendingOtp.studentNumber || studentNumberFromEmail(email),
    });
    if (!nextProfile.studentNumber) nextProfile.studentNumber = studentNumberFromEmail(email);
    if (personName(pendingOtp.name)) nextProfile.name = personName(pendingOtp.name);
    pendingRef.current = { user: nextUser, profile: nextProfile };
    setPendingOtp(null);
    setEmailVerified(true);
    await persist(nextUser, nextProfile);
    setUser(nextUser);
    setProfile(await withBudget(nextProfile));
    pendingRef.current = null;
    return nextProfile;
  }, [pendingOtp]);

  const confirmEmailVerified = useCallback(async () => true, []);

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
    setPendingOtp(null);
    setSessionLocked(false);
    skipLockRef.current = false;
    if (wipeAll) {
      await forgetProfile(user, profile);
      await disableUnlock();
      await wipeLocalUfitnessData();
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(GUEST_KEY);
      await clearPendingSignup();
    }
  };

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.warn('Supabase sign out skipped', error?.message || error);
      }
    }
    await markSignedOut();
    await resetLocalSession();
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase || !user?.id) {
        if (alive) setServerAdmin(false);
        return;
      }
      try {
        const { data, error } = await supabase.rpc('is_campus_admin');
        if (!alive) return;
        setServerAdmin(!error && data === true);
      } catch {
        if (alive) setServerAdmin(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user?.id, user?.email]);

  const deleteAccount = async () => {
    if (supabase) {
      try {
        const { error } = await supabase.rpc('delete_own_account');
        if (error) {
          // Fallback if RPC not applied yet: wipe cloud docs/profile only.
          const { data } = await supabase.auth.getUser();
          if (data.user) {
            await deleteCloudUser(data.user.id);
            const { deleteCloudCaches } = await import('../lib/cloudCache');
            await deleteCloudCaches(data.user.id);
          }
        }
      } catch {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          await deleteCloudUser(data.user.id);
          const { deleteCloudCaches } = await import('../lib/cloudCache');
          await deleteCloudCaches(data.user.id);
        }
      }
      try {
        await supabase.auth.signOut();
      } catch {
        /* session may already be gone after auth.users delete */
      }
    }
    await markSignedOut();
    await resetLocalSession({ wipeAll: true });
  };

  useEffect(() => {
    setCurrentUid(user?.id || null);
  }, [user?.id]);

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

  const roles = useMemo(() => normalizeRoles(profile.roles), [profile.roles]);
  const campusAdmin =
    serverAdmin ||
    isCampusAdmin({
      email: user?.email,
    });
  const capabilities = useMemo(
    () => capabilitiesFor(roles, { isCampusAdmin: campusAdmin }),
    [roles, campusAdmin]
  );

  const grantMentorRole = useCallback(() => {
    updateFields({ roles: withRole(profile.roles, ROLES.MENTOR) });
  }, [profile.roles, updateFields]);

  const value = {
    booting,
    user,
    profile,
    currentStudent,
    communityProfile,
    roles,
    capabilities,
    isMentor: isMentorRole(roles),
    grantMentorRole,
    sessionLocked,
    unlockSession: () => setSessionLocked(false),
    login,
    register,
    resetPassword,
    resendVerificationEmail,
    verifySignupCode,
    confirmEmailVerified,
    emailVerified,
    verificationError,
    awaitingLink,
    pendingOtpEmail: pendingOtp?.email || '',
    clearPendingOtp: () => setPendingOtp(null),
    needsEmailVerification: Boolean(pendingOtp) && !user,
    updateField,
    updateFields,
    completeOnboarding,
    logout,
    deleteAccount,
    canSeeCampusAdmin: campusAdmin,
    authAvailable: isSupabaseConfigured,
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
