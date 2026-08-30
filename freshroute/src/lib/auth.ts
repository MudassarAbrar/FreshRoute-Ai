/**
 * Authentication service for FreshRoute.
 *
 * Uses **Firebase Auth** as the primary identity provider:
 *   - Email / Password sign-up & sign-in
 *   - Google Sign-in (popup)
 *   - Password reset emails
 *
 * On successful Firebase sign-in we also:
 *   1. Persist a lightweight profile to **Firestore** (user_profiles/{uid})
 *   2. Attempt to create / fetch a **Supabase** profile (for the data layer)
 *
 * Supabase remains the data layer for orders, reviews, etc.
 * Firestore stores the real-time user session profile.
 */
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  onAuthStateChanged,
  type User,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { firebaseAuth } from "@/lib/firebase"
import { firestoreDb } from "@/lib/firebase"
import { supabase, backendConfigured } from "@/lib/supabase"
import type { Profile } from "@/types"

const googleProvider = new GoogleAuthProvider()

// ──────────────────────────── Error mapping ────────────────────────────

/**
 * Translates raw Firebase Auth error codes into human-readable messages
 * so users never see "auth/configuration-not-found" style codes.
 */
export function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ""
  switch (code) {
    case "auth/configuration-not-found":
      return "Sign-in is not enabled yet. In the Firebase Console → Authentication → Sign-in method, enable Email/Password (and Google)."
    case "auth/operation-not-allowed":
      return "This sign-in method is disabled. Enable it in Firebase Console → Authentication → Sign-in method."
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead."
    case "auth/invalid-email":
      return "That email address doesn't look right. Please check it and try again."
    case "auth/weak-password":
      return "Password is too weak — use at least 6 characters."
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please try again."
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again."
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed before finishing."
    case "auth/popup-blocked":
      return "Your browser blocked the sign-in popup. Allow popups for this site and try again."
    case "auth/network-request-failed":
      return "Network error — check your internet connection and try again."
    case "auth/invalid-api-key":
      return "The Firebase API key is invalid. Check the VITE_FIREBASE_* values in .env.local."
    default: {
      const msg = (err as { message?: string })?.message ?? ""
      if (msg) return msg.replace(/^Firebase:\s*/, "").replace(/\s*\(auth\/.*\)\.?$/, "")
      return "Something went wrong. Please try again."
    }
  }
}

// ──────────────────────────── Firebase Auth ────────────────────────────

/**
 * Re-throws an error with a human-readable message while keeping the
 * original `code` attached (pages check it for silent cases like
 * popup-closed-by-user).
 */
function rethrowFriendly(err: unknown): never {
  throw Object.assign(new Error(friendlyAuthError(err)), {
    code: (err as { code?: string })?.code ?? "",
  })
}

/**
 * Sign up with email + password via Firebase Auth.
 * Also creates a Firestore user profile and a Supabase profile.
 */
export async function signUp(
  email: string,
  password: string,
  meta: { fullName: string; phone: string; city: string; address: string },
) {
  // 1. Create Firebase Auth account
  let cred
  try {
    cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)
  } catch (err) {
    rethrowFriendly(err)
  }
  if (meta.fullName) {
    await updateProfile(cred.user, { displayName: meta.fullName })
  }

  // 2. Write profile to Firestore
  await setDoc(doc(firestoreDb, "user_profiles", cred.user.uid), {
    fullName: meta.fullName,
    email,
    phone: meta.phone,
    city: meta.city,
    address: meta.address,
    role: "farmer",
    createdAt: serverTimestamp(),
  })

  // 3. Attempt to create Supabase profile (best-effort for data layer)
  if (backendConfigured) {
    try {
      await supabase.from("profiles").insert({
        id: cred.user.uid,
        full_name: meta.fullName,
        email,
        phone: meta.phone,
        city: meta.city,
        address: meta.address,
      })
    } catch (e) {
      console.warn("[Auth] Supabase profile creation failed (non-blocking)", e)
    }
  }

  return { user: cred.user, session: null }
}

/**
 * Sign in with email + password via Firebase Auth.
 */
export async function signIn(email: string, password: string) {
  let cred
  try {
    cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
  } catch (err) {
    rethrowFriendly(err)
  }

  // Ensure Supabase profile exists (best-effort)
  if (backendConfigured) {
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", cred.user.uid)
        .maybeSingle()
      if (!existing) {
        await supabase.from("profiles").insert({
          id: cred.user.uid,
          full_name: cred.user.displayName ?? "",
          email: cred.user.email ?? email,
        })
      }
    } catch (e) {
      console.warn("[Auth] Supabase profile sync failed (non-blocking)", e)
    }
  }

  return { user: cred.user, session: null }
}

/**
 * Sign in with Google (popup) via Firebase Auth.
 * Creates the account if it doesn't exist yet.
 */
export async function signInWithGoogle() {
  let user
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider)
    user = result.user
  } catch (err) {
    rethrowFriendly(err)
  }

  // Write Firestore profile if first sign-in
  const profileRef = doc(firestoreDb, "user_profiles", user.uid)
  const snap = await getDoc(profileRef)
  if (!snap.exists()) {
    await setDoc(profileRef, {
      fullName: user.displayName ?? "",
      email: user.email ?? "",
      phone: user.phoneNumber ?? "",
      city: "",
      address: "",
      role: "farmer",
      createdAt: serverTimestamp(),
    })
  }

  // Best-effort Supabase profile
  if (backendConfigured) {
    try {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.uid)
        .maybeSingle()
      if (!existing) {
        await supabase.from("profiles").insert({
          id: user.uid,
          full_name: user.displayName ?? "",
          email: user.email ?? "",
        })
      }
    } catch (e) {
      console.warn("[Auth] Supabase Google profile sync failed (non-blocking)", e)
    }
  }

  return { user, session: null }
}

/**
 * Sign out of Firebase Auth.
 */
export async function signOut() {
  await fbSignOut(firebaseAuth)
}

/**
 * Send a password reset email via Firebase Auth.
 */
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(firebaseAuth, email, {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: false,
    })
  } catch (err) {
    rethrowFriendly(err)
  }
}

/**
 * Update password via Firebase Auth reset code.
 * The oobCode is extracted from the URL query param (set by Firebase reset email).
 */
export async function updatePassword(newPassword: string) {
  const params = new URLSearchParams(window.location.search)
  const oobCode = params.get("oobCode")
  if (!oobCode) {
    throw new Error("Missing reset code. Please request a new password reset email.")
  }
  // Verify the code is valid (will throw if expired/invalid)
  await verifyPasswordResetCode(firebaseAuth, oobCode)
  // Confirm the password reset
  await confirmPasswordReset(firebaseAuth, oobCode, newPassword)
}

/**
 * Always returns null — Firebase manages sessions internally.
 */
export async function getSession() {
  return null
}

/**
 * Fetch user profile from Firestore (primary) or Supabase (fallback).
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  // Try Firestore first
  try {
    const snap = await getDoc(doc(firestoreDb, "user_profiles", userId))
    if (snap.exists()) {
      const d = snap.data()
      return {
        id: userId,
        fullName: d.fullName ?? "",
        email: d.email ?? "",
        phone: d.phone ?? "",
        city: d.city ?? "",
        address: d.address ?? "",
        role: d.role ?? "farmer",
        customerCode: d.customerCode ?? "",
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      }
    }
  } catch (e) {
    console.warn("[Auth] Firestore profile fetch failed", e)
  }

  // Fallback: Supabase
  if (backendConfigured) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
      if (!error && data) {
        return {
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone,
          city: data.city,
          address: data.address,
          role: data.role,
          customerCode: data.customer_code,
          createdAt: data.created_at,
        }
      }
    } catch (e) {
      console.warn("[Auth] Supabase profile fetch failed", e)
    }
  }

  return null
}

/**
 * Subscribe to Firebase Auth state changes.
 * Returns an object with an unsubscribe method (matches Supabase's API shape).
 */
export function onAuthChange(cb: (user: User | null) => void) {
  const unsub = onAuthStateChanged(firebaseAuth, cb)
  return { data: { subscription: { unsubscribe: unsub } } }
}
