/**
 * Firebase client for FreshRoute.
 *
 * Provides two Google Cloud integrations:
 * 1. **Firebase Auth** — Email/Password + Google Sign-in (mirrors Supabase auth)
 * 2. **Cloud Firestore** — Real-time AI usage telemetry for admin dashboard
 *
 * All configuration lives in VITE_FIREBASE_* env variables.
 * Supabase remains the source of truth for users, orders, and transactions.
 */
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseApp = initializeApp(firebaseConfig)
export const firebaseAuth = getAuth(firebaseApp)
export const firestoreDb = getFirestore(firebaseApp)
