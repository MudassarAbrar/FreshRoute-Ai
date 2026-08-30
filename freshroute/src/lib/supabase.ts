import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True once the user has provided their Supabase project credentials in .env.local */
export const backendConfigured = Boolean(url && anonKey)

export const supabase = createClient(
  url && anonKey ? url : "https://placeholder.supabase.co",
  url && anonKey ? anonKey : "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // handles the reset-password email link
    },
  },
)
