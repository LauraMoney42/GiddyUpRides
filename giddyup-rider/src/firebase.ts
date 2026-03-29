// giddyup-rider — firebase.ts
// gu-002: Firebase client config + Firestore instance.
// PLACEHOLDER keys — swap with real Firebase project config when available.
// Real values live in .env (never committed).

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY            ?? 'PLACEHOLDER_API_KEY',
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        ?? 'giddyup-rides.firebaseapp.com',
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         ?? 'giddyup-rides',
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     ?? 'giddyup-rides.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'PLACEHOLDER_SENDER_ID',
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID             ?? 'PLACEHOLDER_APP_ID',
};

// Prevent duplicate app init on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
