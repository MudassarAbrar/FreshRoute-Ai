/**
 * Firebase Authentication service for FreshRoute.
 *
 * Provides Email/Password and Google Sign-in via Firebase Auth.
 * On successful sign-in, also authenticates with Supabase using the
 * Firebase ID token so the existing data layer (orders, profiles, etc.)
 * continues to work.
 *
 * This dual-auth approach gives the hackathon two Google Cloud touchpoints:
 * - Firebase Auth (user identity)
 * - Cloud Firestore (real-time AI telemetry)
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { firebaseAuth } from "@/lib/firebase"

const googleProvider = new GoogleAuthProvider()

/**
 * Sign up with email + password.
 * Also sets displayName from fullName.
 */
export async function firebaseSignUp(
  email: string,
  password: string,
  fullName: string,
) {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
  if (fullName) {
    await updateProfile(cred.user, { displayName: fullName })
  }
  return cred.user
}

/**
 * Sign in with email + password.
 */
export async function firebaseSignIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
  return cred.user
}

/**
 * Sign in with Google (popup).
 * The user's Google profile name, email, and photo are automatically
 * associated with the Firebase Auth account.
 */
export async function firebaseSignInWithGoogle() {
  const result = await signInWithPopup(firebaseAuth, googleProvider)
  return result.user
}

/**
 * Send a password reset email.
 */
export async function firebaseResetPassword(email: string) {
  await sendPasswordResetEmail(firebaseAuth, email, {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: false,
  })
}

/**
 * Sign out of Firebase Auth.
 */
export async function firebaseSignOutUser() {
  await firebaseSignOut(firebaseAuth)
}

/**
 * Get the current Firebase user (or null if signed out).
 */
export function getCurrentFirebaseUser(): User | null {
  return firebaseAuth.currentUser
}

/**
 * Subscribe to Firebase auth state changes.
 * Returns an unsubscribe function.
 */
export function onFirebaseAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, cb)
}

/**
 * Get the Firebase ID token for the current user.
 * Useful for authenticating with backend services.
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  const user = firebaseAuth.currentUser
  if (!user) return null
  const token = await user.getIdToken()
  return token
}
