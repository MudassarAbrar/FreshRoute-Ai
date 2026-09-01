/**
 * Routing Service — abstraction over GPS routing providers.
 *
 * Provides route calculation, ETA estimation, and reverse geocoding
 * using OSRM (Open Source Routing Machine) and Nominatim (OpenStreetMap).
 *
 * Both are free, no API key required, and sufficient for Pakistan road routing.
 *
 * Per spec Section 29:
 * - OSRM for route/ETA calculations
 * - Nominatim for reverse geocoding
 * - SimulatedProvider for honestly-labeled fallback when APIs are unavailable
 */

// ─── Types ─────────────────────────────────────────────

export interface Coordinates {
  lat: number
  lon: number
}

export interface RouteResult {
  distanceKm: number
  durationMin: number
  geometry: { type: string; coordinates: unknown }
  source: string
}

export interface GeocodeResult {
  displayName: string
  city?: string
  road?: string
  source: string
}

export interface RoutingProvider {
  calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult>
  reverseGeocode(lat: number, lon: number): Promise<GeocodeResult>
  readonly name: string
}

// ─── Constants ─────────────────────────────────────────

const OSRM_BASE_URL = "https://router.project-osrm.org"
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"

/** Maximum age (ms) before a location ping is considered stale. Default: 15 minutes. */
export const MAX_PING_AGE_MS = 15 * 60 * 1000

// ─── OSRM Provider (real) ─────────────────────────────

export class OsrmProvider implements RoutingProvider {
  readonly name = "osrm"

  async calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    const url = `${OSRM_BASE_URL}/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson`

    const res = await fetch(url, {
      headers: { "User-Agent": "FreshRoute/1.0" },
    })
    if (!res.ok) throw new Error(`OSRM route request failed: ${res.status}`)

    const data = await res.json()
    if (data.code !== "Ok" || !data.routes?.[0]) {
      throw new Error(`OSRM route error: ${data.code ?? "no route found"}`)
    }

    const route = data.routes[0]
    return {
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry,
      source: "osrm",
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeocodeResult> {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`

    const res = await fetch(url, {
      headers: { "User-Agent": "FreshRoute/1.0" },
    })
    if (!res.ok) throw new Error(`Nominatim reverse geocode failed: ${res.status}`)

    const data = await res.json()
    return {
      displayName: data.display_name ?? `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      city: data.address?.city ?? data.address?.town ?? data.address?.village,
      road: data.address?.road,
      source: "nominatim",
    }
  }
}

// ─── Simulated Provider (honestly labeled fallback) ───

export class SimulatedProvider implements RoutingProvider {
  readonly name = "simulated"

  async calculateRoute(origin: Coordinates, destination: Coordinates): Promise<RouteResult> {
    // Haversine distance as straight-line estimate
    const R = 6371 // Earth radius in km
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180
    const dLon = ((destination.lon - origin.lon) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((origin.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const straightLineKm = R * c

    // Road distance is typically 1.2-1.4x straight-line in Pakistan
    const distanceKm = Math.round(straightLineKm * 1.3 * 10) / 10
    // Average speed ~55 km/h on Pakistani highways
    const durationMin = Math.round((distanceKm / 55) * 60)

    return {
      distanceKm,
      durationMin,
      geometry: { type: "LineString", coordinates: [[origin.lon, origin.lat], [destination.lon, destination.lat]] },
      source: "simulated",
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<GeocodeResult> {
    return {
      displayName: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)}) — simulated`,
      source: "simulated",
    }
  }
}

// ─── Utility Functions ─────────────────────────────────

/**
 * Calculate ETA between two points using the configured provider.
 * Falls back to SimulatedProvider if the real provider fails.
 */
export async function calculateETA(
  origin: Coordinates,
  destination: Coordinates,
  mode: "driving" = "driving",
  provider: RoutingProvider = new OsrmProvider(),
): Promise<RouteResult & { isSimulated: boolean }> {
  try {
    const result = await provider.calculateRoute(origin, destination)
    return { ...result, isSimulated: provider.name === "simulated" }
  } catch {
    // Fall back to simulated provider
    const sim = new SimulatedProvider()
    const result = await sim.calculateRoute(origin, destination)
    return { ...result, isSimulated: true }
  }
}

/**
 * Reverse geocode a lat/lon pair with fallback.
 */
export async function reverseGeocode(
  lat: number,
  lon: number,
  provider: RoutingProvider = new OsrmProvider(),
): Promise<GeocodeResult & { isSimulated: boolean }> {
  try {
    const result = await provider.reverseGeocode(lat, lon)
    return { ...result, isSimulated: provider.name === "simulated" }
  } catch {
    const sim = new SimulatedProvider()
    const result = await sim.reverseGeocode(lat, lon)
    return { ...result, isSimulated: true }
  }
}

/**
 * Check if a location ping is stale (older than maxAgeMs).
 */
export function isStale(recordedAt: string | Date, maxAgeMs = MAX_PING_AGE_MS): boolean {
  const pingTime = typeof recordedAt === "string" ? new Date(recordedAt).getTime() : recordedAt.getTime()
  return Date.now() - pingTime > maxAgeMs
}

/**
 * Format a human-readable location status string.
 */
export function formatLocationStatus(
  ping: { latitude: number; longitude: number; recorded_at: string; speed_kmh?: number } | null,
  route: RouteResult | null,
  geocode: GeocodeResult | null,
): string {
  if (!ping) {
    return "Location unavailable — tracking not yet active"
  }

  const stale = isStale(ping.recorded_at)
  const location = geocode?.displayName
    ? geocode.city
      ? `near ${geocode.city}`
      : geocode.road
        ? `on ${geocode.road}`
        : `at (${ping.latitude.toFixed(3)}, ${ping.longitude.toFixed(3)})`
    : `at (${ping.latitude.toFixed(3)}, ${ping.longitude.toFixed(3)})`

  if (stale) {
    const timeStr = new Date(ping.recorded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return `Last known: ${location} at ${timeStr} — may be outdated`
  }

  if (route) {
    const etaDate = new Date(Date.now() + route.durationMin * 60_000)
    const etaStr = etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const simLabel = route.source === "simulated" ? " (estimated)" : ""
    return `${location} — ${route.distanceKm} km away. ETA ${etaStr}${simLabel}`
  }

  return location
}
