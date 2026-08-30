import { supabase, backendConfigured } from "@/lib/supabase"
import type { Profile } from "@/types"

const notConfigured = () =>
  new Error(
    "Backend is not connected yet — add your Supabase project URL and anon key to .env.local (see SETUP.md), then restart the dev server.",
  )

export async function signUp(email: string, password: string, meta: { fullName: string; phone: string; city: string; address: string }) {
  if (!backendConfigured) throw notConfigured()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { fullName: meta.fullName, phone: meta.phone, city: meta.city, address: meta.address },
    },
  })
  if (error) throw error
  // update the auto-created profile row with extra fields
  if (data.user) {
    await supabase
      .from("profiles")
      .update({ phone: meta.phone, city: meta.city, address: meta.address })
      .eq("id", data.user.id)
  }
  return data
}

export async function signIn(email: string, password: string) {
  if (!backendConfigured) throw notConfigured()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  if (!backendConfigured) throw notConfigured()
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
  return data
}

export async function updatePassword(newPassword: string) {
  if (!backendConfigured) throw notConfigured()
  const { data, error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
  return data
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  if (error) return null
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

export function onAuthChange(cb: (session: import("@supabase/supabase-js").Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    cb(session)
  })
}
