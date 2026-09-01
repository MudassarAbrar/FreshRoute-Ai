/**
 * Authentication service for FreshRoute.
 *
 * Uses **Supabase Auth** as the sole identity provider:
 *   - Email / Password sign-up & sign-in
 *   - Google Sign-in (OAuth via Supabase)
 *   - Password reset emails
 *
 * On sign-up, the `handle_new_user` DB trigger auto-creates a profile row
 * in `public.profiles` (UUID, full_name from metadata, farmer role).
 * Additional metadata (phone, city, address) is persisted via an update
 * immediately after sign-up, so the profile is complete without relying
 * on a separate auth system.
 */
import { supabase, backendConfigured } from "@/lib/supabase"
import type { Profile } from "@/types"

// ──────────────────────────── Error mapping ────────────────────────────

/**
 * Translates Supabase auth error codes / messages into human-readable strings
 * so users never see internal error codes.
 */
export function friendlyAuthError(err: unknown): string {
  const msg = ((err as { message?: string })?.message ?? String(err)).toLowerCase()
  if (msg.includes("email not confirmed")) return "Please confirm your email address before signing in."
  if (msg.includes("invalid login credentials")) return "Incorrect email or password. Please try again."
  if (msg.includes("user already registered")) return "An account with this email already exists. Try signing in instead."
  if (msg.includes("password should be")) return "Password is too weak — use at least 6 characters."
  if (msg.includes("too many requests")) return "Too many attempts. Please wait a moment and try again."
  if (msg.includes("email is invalid") || msg.includes("invalid email")) return "That email address doesn't look right. Please check it and try again."
  if (msg.includes("network") || msg.includes("fetch")) return "Network error — check your internet connection and try again."
  if (msg.includes("session not found") || msg.includes("token has expired")) return "Your session has expired. Please sign in again."
  if (msg.includes("otp expired")) return "The password reset link has expired. Please request a new one."
  const original = (err as { message?: string })?.message
  if (original) return original
  return "Something went wrong. Please try again."
}

// ──────────────────────────── Helpers ────────────────────────────

function rethrowFriendly(err: unknown): never {
  throw new Error(friendlyAuthError(err))
}

/** Update the current user's profile with optional metadata fields. */
async function syncProfileFields(updates: { phone?: string; city?: string; address?: string; full_name?: string }) {
  if (!backendConfigured) return
  try {
    await supabase.from("profiles").update(updates).eq("id", (await supabase.auth.getUser()).data.user?.id)
  } catch (e) {
    console.warn("[Auth] Profile sync failed (non-blocking)", e)
  }
}

// ──────────────────────────── Sign up ────────────────────────────

/**
 * Sign up with email + password via Supabase Auth.
 * The DB trigger `handle_new_user` auto-creates a profile row and assigns
 * the 'farmer' role. We then update the profile with phone/city/address.
 */
export async function signUp(
  email: string,
  password: string,
  meta: { fullName: string; phone: string; city: string; address: string },
) {
  if (!backendConfigured) throw new Error("Backend not configured")
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          fullName: meta.fullName,
          phone: meta.phone,
          city: meta.city,
          address: meta.address,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) rethrowFriendly(error)

    // Best-effort: persist phone/city/address to profiles row
    // (the trigger already sets full_name and email; this adds the rest)
    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          phone: meta.phone,
          city: meta.city,
          address: meta.address,
        })
        .eq("id", data.user.id)
    }

    // If email confirmation is required, session will be null — the caller
    // should detect this and show a "check your email" message.
    return { user: data.user, session: data.session }
  } catch (err) {
    rethrowFriendly(err)
  }
}

// ──────────────────────────── Sign in ────────────────────────────

/**
 * Sign in with email + password via Supabase Auth.
 * The returned session is stored automatically by the Supabase client.
 */
export async function signIn(email: string, password: string) {
  if (!backendConfigured) throw new Error("Backend not configured")
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) rethrowFriendly(error)
    return { user: data.user, session: data.session }
  } catch (err) {
    rethrowFriendly(err)
  }
}

/**
 * Sign in with Google via Supabase OAuth (browser redirect).
 * The user is redirected to Google's consent screen; on return,
 * `onAuthChange` fires and the Supabase session is established.
 */
export async function signInWithGoogle() {
  if (!backendConfigured) throw new Error("Backend not configured")
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) rethrowFriendly(error)
    // Note: the browser will redirect to Google. No return value here —
    // onAuthChange fires when the user comes back after consent.
    return { user: null, session: null }
  } catch (err) {
    rethrowFriendly(err)
  }
}

// ──────────────────────────── Sign out ────────────────────────────

export async function signOut() {
  if (!backendConfigured) return
  const { error } = await supabase.auth.signOut()
  if (error) rethrowFriendly(error)
}

// ──────────────────────────── Password reset ────────────────────────────

/**
 * Send a password reset email via Supabase Auth.
 * The reset link points to `/reset-password` on the current origin.
 */
export async function resetPassword(email: string) {
  if (!backendConfigured) throw new Error("Backend not configured")
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) rethrowFriendly(error)
  } catch (err) {
    rethrowFriendly(err)
  }
}

/**
 * Update the current user's password.
 * Supabase detects the reset-password link via the URL fragment
 * (configured in supabase.ts with `detectSessionInUrl: true`).
 * After the link is processed, the client has a valid session and
 * `updateUser({ password })` works.
 */
export async function updatePassword(newPassword: string) {
  if (!backendConfigured) throw new Error("Backend not configured")
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) rethrowFriendly(error)
  } catch (err) {
    rethrowFriendly(err)
  }
}

// ──────────────────────────── Session helpers ────────────────────────────

/**
 * Returns the current Supabase session, or null if the user is signed out.
 * Used by ProtectedRoute to gate protected pages.
 */
export async function getSession() {
  if (!backendConfigured) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session
}

/**
 * Fetch the current user's profile from the `profiles` table.
 * Returns null if not found.
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!backendConfigured) return null
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
    if (error || !data) return null
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
  } catch (e) {
    console.warn("[Auth] Profile fetch failed", e)
    return null
  }
}

/**
 * Subscribe to Supabase auth state changes.
 * Returns an object with `data.subscription.unsubscribe()` to match
 * the shape expected by ProtectedRoute.
 */
export function onAuthChange(cb: (user: import("@supabase/supabase-js").User | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session?.user ?? null)
  })
  return data // { subscription: { unsubscribe() } }
}

// Unused — kept as no-op for backwards compat (previously used by Firebase auth)
void syncProfileFields
