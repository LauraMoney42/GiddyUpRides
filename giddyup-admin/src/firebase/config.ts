// giddyup-admin — firebase/config.ts
// gu-002: Firebase client config + Firestore instance for admin dashboard.
// PLACEHOLDER keys — swap with real Firebase project config when available.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? 'PLACEHOLDER_API_KEY',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? 'giddyup-rides.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? 'giddyup-rides',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? 'giddyup-rides.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? 'PLACEHOLDER_SENDER_ID',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? 'PLACEHOLDER_APP_ID',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
