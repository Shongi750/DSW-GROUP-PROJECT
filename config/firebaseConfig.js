// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Firebase configuration shared by Auth and Firestore.

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getReactNativePersistence, getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAdkE0m7L60vzXQEIT9YKvq4KPHxWJYf4w",
  authDomain: "buddy-12b08.firebaseapp.com",
  projectId: "buddy-12b08",
  storageBucket: "buddy-12b08.firebasestorage.app",
  messagingSenderId: "389207312101",
  appId: "1:389207312101:web:6ef168bee93666dbe6360c",
  measurementId: "G-P87V93EE8J"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Fast refresh can initialize Auth more than once.
  auth = getAuth(app);
}

export { auth };
