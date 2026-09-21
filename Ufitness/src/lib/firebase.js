import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

const APP_NAME = 'ufitness';

let app = null;
let auth = null;
let db = null;

function ensureApp() {
  if (!isFirebaseConfigured) return null;
  if (!app) {
    app = getApps().find((item) => item.name === APP_NAME) || initializeApp(config, APP_NAME);
  }
  return app;
}

export function getFirebaseApp() {
  return ensureApp();
}

export function getFirebaseAuth() {
  if (!isFirebaseConfigured) return null;
  if (auth) return auth;
  const instance = ensureApp();

  const reactNativePersistence = firebaseAuth.getReactNativePersistence;
  const webPersistence = firebaseAuth.indexedDBLocalPersistence || firebaseAuth.browserLocalPersistence;
  try {
    if (typeof reactNativePersistence === 'function') {
      auth = firebaseAuth.initializeAuth(instance, {
        persistence: reactNativePersistence(AsyncStorage),
      });
    } else if (Platform.OS === 'web' && webPersistence) {
      auth = firebaseAuth.initializeAuth(instance, { persistence: webPersistence });
    } else {
      auth = firebaseAuth.getAuth(instance);
    }
  } catch {
    auth = firebaseAuth.getAuth(instance);
  }
  return auth;
}

export function getDb() {
  if (!isFirebaseConfigured) return null;
  if (db) return db;
  const instance = ensureApp();
  try {
    db = initializeFirestore(instance, Platform.OS === 'web' ? {} : { experimentalForceLongPolling: true });
  } catch {
    db = getFirestore(instance);
  }
  return db;
}

export function requireDb() {
  const next = getDb();
  if (!next) {
    throw new Error('Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* to Ufitness/.env and restart Expo.');
  }
  return next;
}

export function requireAuth() {
  const next = getFirebaseAuth();
  if (!next) {
    throw new Error('Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* to Ufitness/.env and restart Expo.');
  }
  return next;
}

export const missingFirebaseKeys = Object.entries(config)
  .filter(([, value]) => !value)
  .map(([key]) => key);
