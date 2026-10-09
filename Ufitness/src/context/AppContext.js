import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { groceryTotalFromList, remainingAfterGrocery, resolveWeeklyBudget } from '../features/meals/lib/budget';
import { EMPTY_DIET_FILTERS } from '../features/meals/lib/diet';
import { loadSavedPlan } from '../features/meals/lib/persist';
import { authError, isSupabaseConfigured, supabase } from '../lib/supabase';
import { checkCloudSetup, setCurrentUid } from '../lib/cloudCache';
import { wipeLocalUfitnessData } from '../lib/wipeLocal';
import { forgetProfile, recallProfile, rememberProfile, setupLooksComplete } from '../lib/profileStore';
import { deleteCloudUser, fetchCloudUser, mergeCloudProfile, saveCloudUser } from '../lib/cloudUser';
import { assertUjStudentAccount, isCampusAdmin, personName, studentNumberFromEmail } from '../lib/ujEmail';
import { markSignedOut, preferSignUp } from '../lib/authEntry';
import { clearLegacySecrets, disableUnlock, shouldLockSession } from '../lib/biometrics';
import { pingDailyUsage } from '../lib/usagePing';
import { clearPendingSignup, currentHref } from '../lib/emailLink';
import { capabilitiesFor, isMentorRole, normalizeRoles, ROLES, withRole } from '../lib/roles';
import { isRateLimitError } from '../lib/resendCooldown';
import { fetchMySuspension } from '../lib/moderation';
import { AppState } from 'react-native';
import { startAutoSync } from '../lib/autoSync';
import { isLegacyLocalId, isRealAuthUserId } from '../lib/authGuard';
import { activateWorkoutProfileFor } from '../features/workout/lib/workoutCache';

// Shown when the build has no EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY.
// Old builds silently created a phone-only "local-…" account here and opened Home; that
// account never existed in Supabase Auth, so it is no longer allowed.
const NO_SUPABASE_MESSAGE =
  'UFitness can\'t reach its account server (Supabase keys missing from .env). Restart Expo after adding them.';

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
    console.warn('Supabase is not configured. Check Ufitness/.env');
    throw new Error('Sign-in is temporarily unavailable. Try again later.');
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
  // A "local-…" user from an old offline build was never a Supabase account: don't restore it
  // as signed in. Its profile is still kept (and migrated by email on the next real sign-in).
  const savedUser = saved.user && !isLegacyLocalId(saved.user.id) ? saved.user : null;
  return {
    user: savedUser,
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
  if (!nextUser || !isRealAuthUserId(nextUser.id)) return; // never save a fake/signed-out session
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
  // Always ask the cloud too: a profile saved on another phone (or before a reinstall) must come
  // back on login instead of sending the student through setup again. mergeCloudProfile keeps
  // local edits and fills gaps from the cloud. fetchCloudUser returns null offline.
  const remote = await fetchCloudUser(authUser.uid);
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
  // Register fields kept in memory when the student taps "Use a different email".
  const [registerDraft, setRegisterDraft] = useState(null);
  const [sessionLocked, setSessionLocked] = useState(false);
  const [serverAdmin, setServerAdmin] = useState(false);
  // Campus Admin can suspend an account (profiles.suspended). Checked on sign-in and app foreground.
  const [suspension, setSuspension] = useState({ suspended: false, reason: '' });
  const pendingRef = useRef(null);
  const skipLockRef = useRef(false);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    const applyBudgeted = async (nextUser, nextProfile) => {
      if (nextUser?.id) await activateWorkoutProfileFor(nextUser.id, nextUser.email);
      const budgeted = await withBudget(nextProfile);
      if (!active) return;
      setUser(nextUser);
      setProfile(budgeted);
      if (nextUser?.id) {
        pingDailyUsage(nextUser.id);
        checkCloudSetup(); // sets the sync badge (Synced / Cloud not set up)
      }
      if (nextUser && !skipLockRef.current && (await shouldLockSession())) {
        setSessionLocked(true);
      } else {
        setSessionLocked(false);
      }
      skipLockRef.current = false;
    };

    (async () => {
      try {
        // Old builds kept the password in SecureStore; wipe it on every start.
        await clearLegacySecrets();
        await startLoggedOutIfRequested();
        await clearPendingSignup();
        const saved = await readSavedSession();
        if (!isSupabaseConfigured || !supabase) {
          // No account server → nobody is signed in. (Old builds restored a local-only user here.)
          console.warn('Supabase is not configured. Check Ufitness/.env');
          setEmailVerified(true);
          setAwaitingLink(false);
          await applyBudgeted(null, emptyProfile);
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
      await activateWorkoutProfileFor(nextUser.id, nextUser.email);
      const budgeted = await withBudget(nextProfile);
      setUser(nextUser);
      setProfile(budgeted);
      pendingRef.current = null;
      await AsyncStorage.removeItem(GUEST_KEY);
      pingDailyUsage(nextUser.id);
      return budgeted;
    }

    throw new Error(NO_SUPABASE_MESSAGE);
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
        sentAt: Date.now(), // starts the 60 s "Send a new code" cooldown
      });
      setRegisterDraft(null);
      return { needsOtp: true };
    }

    throw new Error(NO_SUPABASE_MESSAGE);
  };

  const resetPassword = async (email) => {
    const account = assertUjStudentAccount({ email });
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase is not configured. Check Ufitness/.env');
      throw new Error('Sign-in is temporarily unavailable. Try again later.');
    }
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(account.email, { redirectTo });
    if (error) throw new Error(authError(error));
  };

  // Resend the sign-up code. Supabase's resend for an unconfirmed sign-up is
  // auth.resend({ type: 'signup' }). Errors are thrown as-is (status / code / message)
  // so VerifyEmailScreen can show the right wait time for rate limits.
  const resendVerificationEmail = useCallback(async () => {
    const email = pendingOtp?.email;
    if (!email) {
      throw new Error('Create the account again before asking for another code.');
    }
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Sign-in is temporarily unavailable. Try again later.');
    }
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      if (isRateLimitError(error) || /network|fetch/i.test(String(error.message || ''))) throw error;
      // Not a rate limit (e.g. the account was created another way): send a normal email code instead.
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
    }
    const sentAt = Date.now();
    setPendingOtp((current) => (current ? { ...current, sentAt } : current));
    return sentAt;
  }, [pendingOtp]);

  // Back to Register with the same name / student number / password filled in.
  const backToRegister = useCallback(() => {
    if (pendingOtp) {
      setRegisterDraft({
        name: pendingOtp.name || '',
        studentNumber: pendingOtp.studentNumber || '',
        password: pendingOtp.password || '',
      });
    }
    setPendingOtp(null);
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
    if (!data.user || !data.session || !isRealAuthUserId(data.user.id)) {
      throw new Error('That code did not confirm the account. Request a new one.');
    }
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
    await activateWorkoutProfileFor(nextUser.id, nextUser.email);
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

  // Offline queue: flush on reconnect / foreground while signed in.
  useEffect(() => {
    if (!user?.id) return undefined;
    return startAutoSync(user.id);
  }, [user?.id]);

  const recheckSuspension = useCallback(async () => {
    if (!user?.id) {
      setSuspension({ suspended: false, reason: '' });
      return { suspended: false, reason: '' };
    }
    const next = await fetchMySuspension();
    setSuspension(next);
    return next;
  }, [user?.id]);

  useEffect(() => {
    recheckSuspension();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') recheckSuspension();
    });
    return () => sub.remove();
  }, [recheckSuspension]);

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

  // Local only. The cloud keeps "mentor" only when an admin grants it or an invite is
  // accepted (accept_mentor_invite), so this is just for the dev "Try Mentor Hub" shortcut.
  const grantMentorRole = useCallback(() => {
    updateFields({ roles: withRole(profile.roles, ROLES.MENTOR) });
  }, [profile.roles, updateFields]);

  // After accept_mentor_invite() the server returns the real roles list.
  const applyServerRoles = useCallback(
    (serverRoles) => {
      updateFields({ roles: normalizeRoles([...normalizeRoles(profile.roles), ...normalizeRoles(serverRoles)]) });
    },
    [profile.roles, updateFields]
  );

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
    applyServerRoles,
    sessionLocked,
    suspension,
    recheckSuspension,
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
    codeSentAt: pendingOtp?.sentAt || 0,
    clearPendingOtp: () => setPendingOtp(null),
    backToRegister,
    registerDraft,
    clearRegisterDraft: () => setRegisterDraft(null),
    needsEmailVerification: Boolean(pendingOtp) && !isRealAuthUserId(user?.id),
    pendingOtp: Boolean(pendingOtp),
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
