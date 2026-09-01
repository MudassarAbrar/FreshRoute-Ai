/**
 * Integration Health Hook — Phase 8 simulation disclosure.
 *
 * Fetches the /integration-health endpoint and provides
 * simulation status for all external integrations.
 * UI components use this to display honest badges.
 */

import { create } from "zustand"

export interface IntegrationHealth {
  gemini: { status: "live" | "not_configured"; model: string; note?: string }
  whatsapp: { status: "live" | "simulated"; adapter: string; note?: string }
  gps_routing: { status: "live"; provider: string; note?: string }
  price_data: { status: "live" | "seed_data" | "none"; source: string; count: number }
  weather: { status: "hardcoded"; note?: string }
  marketplace: {
    buyers: { status: "live" | "db_profiles" | "none"; count: number }
    transporters: { status: "live" | "db_profiles" | "none"; count: number }
    storages: { status: "live" | "db_profiles" | "none"; count: number }
  }
  state_machine: { status: "live"; enforcement: string; note?: string }
  timestamp: string
  version: string
}

const DEFAULT_HEALTH: IntegrationHealth = {
  gemini: { status: "not_configured", model: "gemini-flash-latest" },
  whatsapp: { status: "simulated", adapter: "SimulatedMessagingProvider" },
  gps_routing: { status: "live", provider: "osrm" },
  price_data: { status: "seed_data", source: "seed_migration", count: 45 },
  weather: { status: "hardcoded" },
  marketplace: {
    buyers: { status: "db_profiles", count: 0 },
    transporters: { status: "db_profiles", count: 0 },
    storages: { status: "db_profiles", count: 0 },
  },
  state_machine: { status: "live", enforcement: "db_trigger" },
  timestamp: new Date().toISOString(),
  version: "1.0.0",
}

interface HealthState {
  health: IntegrationHealth
  loading: boolean
  error: string | null
  lastFetched: number | null
  fetchHealth: () => Promise<void>
  /** Check if a specific integration is simulated */
  isSimulated: (integration: keyof IntegrationHealth) => boolean
}

export const useIntegrationHealth = create<HealthState>((set, get) => ({
  health: DEFAULT_HEALTH,
  loading: false,
  error: null,
  lastFetched: null,

  fetchHealth: async () => {
    set({ loading: true })
    try {
      const { supabase } = await import("@/lib/supabase")
      const { data, error } = await supabase.functions.invoke("integration-health", {
        method: "GET",
      })

      if (error) throw new Error(error.message)
      if (data) {
        set({ health: data as IntegrationHealth, loading: false, error: null, lastFetched: Date.now() })
      }
    } catch (e) {
      // Fall back to defaults (assumes simulated)
      set({ loading: false, error: e instanceof Error ? e.message : "Failed to fetch health" })
    }
  },

  isSimulated: (integration: keyof IntegrationHealth) => {
    const health = get().health
    const entry = health[integration]
    if (!entry || typeof entry !== "object") return false
    const status = (entry as Record<string, unknown>).status
    return status === "simulated" || status === "seed_data" || status === "hardcoded" || status === "not_configured"
  },
}))

// ─── Badge Text Helpers ────────────────────────────────

/**
 * Get human-readable badge text for an integration.
 */
export function getIntegrationBadge(health: IntegrationHealth, integration: string): {
  label: string
  color: "green" | "yellow" | "red" | "gray"
  tooltip: string
} {
  switch (integration) {
    case "gemini":
      return health.gemini.status === "live"
        ? { label: "AI Live", color: "green", tooltip: "Gemini AI is configured and responding" }
        : { label: "AI Demo", color: "yellow", tooltip: health.gemini.note ?? "AI using demo fallbacks" }

    case "whatsapp":
      return health.whatsapp.status === "live"
        ? { label: "WhatsApp Live", color: "green", tooltip: "WhatsApp Cloud API is configured" }
        : { label: "WhatsApp Simulated", color: "yellow", tooltip: "Messages are simulated — not actually delivered" }

    case "gps_routing":
      return { label: "GPS Live (OSRM)", color: "green", tooltip: "Routing via OpenStreetMap OSRM" }

    case "price_data":
      return health.price_data.status === "live"
        ? { label: "Prices Live", color: "green", tooltip: "Real-time market prices" }
        : health.price_data.status === "seed_data"
          ? { label: "Prices (Seed Data)", color: "yellow", tooltip: "Using seed data — not live market prices" }
          : { label: "No Price Data", color: "red", tooltip: "No price data available" }

    case "weather":
      return { label: "Weather (Static)", color: "yellow", tooltip: "Using static weather data — not real-time" }

    default:
      return { label: "Unknown", color: "gray", tooltip: "Integration status unknown" }
  }
}

/**
 * Check if ANY integration is simulated — used for the global simulation banner.
 */
export function hasAnySimulatedIntegration(health: IntegrationHealth): boolean {
  return (
    health.gemini.status === "not_configured" ||
    health.whatsapp.status === "simulated" ||
    health.price_data.status !== "live" ||
    health.weather.status === "hardcoded"
  )
}
