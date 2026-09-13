import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCYIrKif6zPVZJR6Qse2gOKpc_ABlB1e6U",
  authDomain: "ufitness-96611.firebaseapp.com",
  projectId: "ufitness-96611",
  storageBucket: "ufitness-96611.firebasestorage.app",
  messagingSenderId: "884285829066",
  appId: "1:884285829066:web:202e600a0a7fee10cf6933",
  measurementId: "G-EKWZQYCY6B"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Auth with AsyncStorage so users stay logged in
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});