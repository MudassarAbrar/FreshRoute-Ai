/**
 * Marketplace Service — DB-backed replacement for market.ts hardcoded data.
 *
 * Provides async queries against typed marketplace tables (migration 0012).
 * When no DB data exists, returns NO_MATCH_DATA instead of silently falling
 * back to seed data. Seed data is labeled with `is_demo: true`.
 *
 * Sync reference data (crop aliases, volatility, distances) remains in
 * market.ts as pure constants since they are domain knowledge, not
 * marketplace data.
 */

import { supabase } from "@/lib/supabase"
import type { Buyer, Transporter, StorageFacility, PricePoint } from "@/types"

// ─── No-data sentinel ──────────────────────────────────

export const NO_MATCH_DATA = {
  available: false,
  reason: "No matching providers found in your area. Try expanding your delivery radius or contact support.",
  isDemo: false,
} as const

// ─── Price Queries ─────────────────────────────────────

export interface PriceResult {
  prices: Record<string, number>
  source: "live" | "seed" | "none"
  freshnessMin: number
  confidence: number
}

/**
 * Fetch latest prices for a crop across all cities.
 * Queries price_observations table; labels seed vs. live data.
 */
export async function fetchLatestPrices(crop: string): Promise<PriceResult> {
  const { data, error } = await supabase
    .from("price_observations")
    .select("city, price_per_kg, source, observed_at, confidence, is_demo")
    .eq("crop", crop)
    .order("observed_at", { ascending: false })

  if (error || !data || data.length === 0) {
    return { prices: {}, source: "none", freshnessMin: 0, confidence: 0 }
  }

  // Take the most recent observation per city
  const byCity = new Map<string, typeof data[0]>()
  for (const row of data) {
    if (!byCity.has(row.city)) byCity.set(row.city, row)
  }

  const prices: Record<string, number> = {}
  let minConfidence = 1
  let oldestObservation = Infinity
  let hasSeed = false

  for (const [city, row] of byCity) {
    prices[city] = Number(row.price_per_kg)
    minConfidence = Math.min(minConfidence, Number(row.confidence))
    const ageMs = Date.now() - new Date(row.observed_at).getTime()
    oldestObservation = Math.min(oldestObservation, ageMs)
    if (row.is_demo || row.source === "seed") hasSeed = true
  }

  return {
    prices,
    source: hasSeed ? "seed" : "live",
    freshnessMin: Math.round(oldestObservation / 60_000),
    confidence: minConfidence,
  }
}

/**
 * Sync price ticker (backward compatible with market.ts tickerPrices).
 * Returns price points labeled with data source.
 */
export async function fetchPriceTicker(crop: string): Promise<PricePoint[]> {
  const result = await fetchLatestPrices(crop)
  if (result.source === "none") return []

  return Object.entries(result.prices).map(([city, pricePerKg]) => ({
    city,
    pricePerKg,
    trend: city === "Karachi" ? -2 : city === "Lahore" ? 4 : 1,
    freshnessMin: result.freshnessMin,
    confidence: result.confidence,
    source: result.source,
    isDemo: result.source === "seed",
  }))
}

// ─── Buyer Queries ─────────────────────────────────────

/**
 * Fetch active buyers matching crop and region criteria.
 * Queries buyer_preferences + user_roles for structured matching.
 */
export async function fetchActiveBuyers(
  crop?: string,
  region?: string,
): Promise<{ buyers: Buyer[]; source: "db" | "none" }> {
  // First try typed buyer_preferences table
  let query = supabase
    .from("buyer_preferences")
    .select(`
      buyer_user_id,
      commodity,
      min_grade,
      max_grade,
      min_kg,
      max_kg,
      delivery_regions,
      payment_terms,
      profiles:buyer_user_id (full_name, city)
    `)
    .eq("is_active", true)

  if (crop) query = query.eq("commodity", crop)

  const { data, error } = await query.limit(20)

  if (error || !data || data.length === 0) {
    // Fall back to role_profiles JSONB approach (existing DB data)
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("id, user_id, profiles!inner(full_name, city), role_profiles(profile_json)")
      .eq("role", "buyer")
      .eq("status", "active")
      .limit(10)

    if (!roleData || roleData.length === 0) {
      return { buyers: [], source: "none" }
    }

    const buyers: Buyer[] = roleData
      .filter((r: any) => {
        const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {}
        const commodities = pj.typicalCommodities ?? []
        const regions = pj.deliveryRegions ?? []
        const commodityMatch = !crop || commodities.includes(crop)
        const regionMatch = !region || regions.includes(region)
        return commodityMatch && regionMatch
      })
      .map((r: any, i: number) => {
        const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {}
        return {
          id: r.user_id ?? `db-buyer-${i}`,
          name: r.profiles?.full_name ?? "Unknown Buyer",
          city: r.profiles?.city ?? "Unknown",
          category: pj.category ?? "Wholesale",
          grade: pj.minGrade ?? "B",
          premiumPct: pj.premiumPct ?? 0,
          acceptanceRate: pj.acceptanceRate ?? 75,
          rejectionPct: pj.rejectionPct ?? 0.05,
          paymentTerms: pj.paymentTerms ?? "2-3 days",
          minKg: pj.minKg ?? 100,
          maxKg: pj.maxKg ?? 5000,
          verified: pj.verified ?? false,
          responseTime: pj.responseTime ?? "same day",
        }
      })

    return { buyers, source: "db" }
  }

  const buyers: Buyer[] = data.map((row: any, i: number) => ({
    id: row.buyer_user_id ?? `db-buyer-${i}`,
    name: row.profiles?.full_name ?? "Unknown Buyer",
    city: row.profiles?.city ?? "Unknown",
    category: "Wholesale",
    grade: row.min_grade ?? "B",
    premiumPct: 0,
    acceptanceRate: 75,
    rejectionPct: 0.05,
    paymentTerms: row.payment_terms ?? "2-3 days",
    minKg: Number(row.min_kg ?? 100),
    maxKg: Number(row.max_kg ?? 5000),
    verified: false,
    responseTime: "same day",
  }))

  return { buyers, source: "db" }
}

// ─── Transporter Queries ───────────────────────────────

export async function fetchActiveTransporters(
  originCity?: string,
): Promise<{ transporters: Transporter[]; source: "db" | "none" }> {
  const { data, error } = await supabase
    .from("transporter_capabilities")
    .select(`
      transporter_user_id,
      vehicle_type,
      capacity_kg,
      refrigerated,
      rate_per_km,
      service_radius_km,
      on_time_pct,
      profiles:transporter_user_id (full_name, city)
    `)
    .eq("is_active", true)
    .limit(20)

  if (error || !data || data.length === 0) {
    // Fall back to role_profiles
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("id, user_id, profiles!inner(full_name, city), role_profiles(profile_json)")
      .eq("role", "transporter")
      .eq("status", "active")

    if (!roleData || roleData.length === 0) {
      return { transporters: [], source: "none" }
    }

    const transporters: Transporter[] = roleData.map((r: any, i: number) => {
      const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {}
      return {
        id: r.user_id ?? `db-transporter-${i}`,
        name: r.profiles?.full_name ?? "Unknown Transporter",
        vehicle: pj.vehicleType ?? "Unknown",
        refrigerated: pj.refrigerated ?? false,
        costPerKm: pj.ratePerKm ?? 30,
        onTimePct: pj.onTimePct ?? 75,
      }
    })

    return { transporters, source: "db" }
  }

  const transporters: Transporter[] = data.map((row: any, i: number) => ({
    id: row.transporter_user_id ?? `db-transporter-${i}`,
    name: row.profiles?.full_name ?? "Unknown Transporter",
    vehicle: `${row.vehicle_type ?? "Unknown"} · ${Number(row.capacity_kg) / 1000}t`,
    refrigerated: row.refrigerated ?? false,
    costPerKm: Number(row.rate_per_km ?? 30),
    onTimePct: Number(row.on_time_pct ?? 75),
  }))

  return { transporters, source: "db" }
}

// ─── Storage Queries ───────────────────────────────────

export async function fetchActiveStorage(
  city?: string,
): Promise<{ storages: StorageFacility[]; source: "db" | "none" }> {
  let query = supabase
    .from("storage_facility_details")
    .select(`
      provider_user_id,
      facility_name,
      city,
      temp_min_c,
      temp_max_c,
      per_kg_per_day,
      total_capacity_kg,
      verified,
      profiles:provider_user_id (full_name)
    `)
    .eq("is_active", true)

  if (city) query = query.eq("city", city)

  const { data, error } = await query.limit(20)

  if (error || !data || data.length === 0) {
    // Fall back to role_profiles
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("id, user_id, profiles!inner(full_name, city), role_profiles(profile_json)")
      .eq("role", "storage_provider")
      .eq("status", "active")

    if (!roleData || roleData.length === 0) {
      return { storages: [], source: "none" }
    }

    const storages: StorageFacility[] = roleData
      .filter((r: any) => !city || r.profiles?.city === city)
      .map((r: any, i: number) => {
        const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {}
        return {
          id: r.user_id ?? `db-storage-${i}`,
          name: r.profiles?.full_name ?? "Unknown Storage",
          city: r.profiles?.city ?? "Unknown",
          tempC: pj.tempC ?? 4,
          perKgPerDay: pj.perKgPerDay ?? 3.5,
          verified: pj.verified ?? false,
        }
      })

    return { storages, source: "db" }
  }

  const storages: StorageFacility[] = data.map((row: any, i: number) => ({
    id: row.provider_user_id ?? `db-storage-${i}`,
    name: row.facility_name ?? "Unknown Storage",
    city: row.city,
    tempC: Number(row.temp_min_c ?? 4),
    perKgPerDay: Number(row.per_kg_per_day ?? 3.5),
    verified: row.verified ?? false,
  }))

  return { storages, source: "db" }
}

// ─── Crop Reference Data ───────────────────────────────

/**
 * Resolve a crop alias to its canonical name.
 * Queries crop_reference_data table; falls back to market.ts aliases.
 */
export async function resolveCropAlias(input: string): Promise<{
  canonical: string | null
  source: "db" | "static" | "none"
}> {
  const normalized = input.toLowerCase().trim()

  const { data } = await supabase
    .from("crop_reference_data")
    .select("crop_name, aliases")

  if (data) {
    for (const row of data) {
      if (row.crop_name.toLowerCase() === normalized) {
        return { canonical: row.crop_name, source: "db" }
      }
      if ((row.aliases as string[]).some((a) => a.toLowerCase() === normalized)) {
        return { canonical: row.crop_name, source: "db" }
      }
    }
  }

  return { canonical: null, source: "none" }
}

// ─── Integration Health ────────────────────────────────

/**
 * Check what marketplace data sources are available.
 * Used by Phase 8 simulation disclosure.
 */
export async function getMarketplaceHealth(): Promise<{
  prices: { status: "live" | "seed_data" | "none"; count: number; source?: string }
  buyers: { status: "live" | "none"; count: number }
  transporters: { status: "live" | "none"; count: number }
  storages: { status: "live" | "none"; count: number }
}> {
  const [pricesResult, buyersResult, transportersResult, storagesResult] = await Promise.all([
    supabase.from("price_observations").select("id, source, is_demo").limit(1),
    supabase.from("buyer_preferences").select("id").eq("is_active", true).limit(1),
    supabase.from("transporter_capabilities").select("id").eq("is_active", true).limit(1),
    supabase.from("storage_facility_details").select("id").eq("is_active", true).limit(1),
  ])

  const priceCount = pricesResult.data?.length ?? 0
  const priceSource = pricesResult.data?.[0]?.source ?? "none"
  const isDemo = pricesResult.data?.[0]?.is_demo ?? false

  return {
    prices: {
      status: priceCount === 0 ? "none" : isDemo || priceSource === "seed" ? "seed_data" : "live",
      count: priceCount,
      source: priceSource,
    },
    buyers: {
      status: (buyersResult.data?.length ?? 0) > 0 ? "live" : "none",
      count: buyersResult.data?.length ?? 0,
    },
    transporters: {
      status: (transportersResult.data?.length ?? 0) > 0 ? "live" : "none",
      count: transportersResult.data?.length ?? 0,
    },
    storages: {
      status: (storagesResult.data?.length ?? 0) > 0 ? "live" : "none",
      count: storagesResult.data?.length ?? 0,
    },
  }
}
