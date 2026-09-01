/**
 * Baseline tests for the routing service.
 *
 * Tests OSRM/Simulated provider behavior, staleness detection,
 * and location status formatting.
 */
import { describe, it, expect } from "vitest"
import {
  SimulatedProvider,
  isStale,
  formatLocationStatus,
  MAX_PING_AGE_MS,
} from "@/lib/routing"

describe("routing", () => {
  describe("SimulatedProvider", () => {
    const sim = new SimulatedProvider()

    it("should have name 'simulated'", () => {
      expect(sim.name).toBe("simulated")
    })

    it("should calculate route with positive distance and duration", async () => {
      const result = await sim.calculateRoute(
        { lat: 30.1575, lon: 71.5249 }, // Multan
        { lat: 31.5204, lon: 74.3587 }, // Lahore
      )
      expect(result.distanceKm).toBeGreaterThan(0)
      expect(result.durationMin).toBeGreaterThan(0)
      expect(result.source).toBe("simulated")
    })

    it("should return distance roughly in the right range for Multan-Lahore (~400km)", async () => {
      const result = await sim.calculateRoute(
        { lat: 30.1575, lon: 71.5249 }, // Multan
        { lat: 31.5204, lon: 74.3587 }, // Lahore
      )
      // Straight line ~380km, road ~1.3x = ~494km
      expect(result.distanceKm).toBeGreaterThan(300)
      expect(result.distanceKm).toBeLessThan(700)
    })

    it("should return duration based on ~55 km/h average", async () => {
      const result = await sim.calculateRoute(
        { lat: 30.1575, lon: 71.5249 },
        { lat: 31.5204, lon: 74.3587 },
      )
      // ~494km / 55 km/h = ~540 min = ~9 hours
      expect(result.durationMin).toBeGreaterThan(300)
      expect(result.durationMin).toBeLessThan(900)
    })

    it("should return simulated reverse geocode", async () => {
      const result = await sim.reverseGeocode(31.5204, 74.3587)
      expect(result.displayName).toContain("simulated")
      expect(result.source).toBe("simulated")
    })

    it("should handle zero-distance route (same point)", async () => {
      const result = await sim.calculateRoute(
        { lat: 31.5204, lon: 74.3587 },
        { lat: 31.5204, lon: 74.3587 },
      )
      expect(result.distanceKm).toBe(0)
      expect(result.durationMin).toBe(0)
    })
  })

  describe("isStale", () => {
    it("should return false for a recent ping (1 minute ago)", () => {
      const recent = new Date(Date.now() - 60_000).toISOString()
      expect(isStale(recent)).toBe(false)
    })

    it("should return true for an old ping (1 hour ago)", () => {
      const old = new Date(Date.now() - 3_600_000).toISOString()
      expect(isStale(old)).toBe(true)
    })

    it("should return true for a ping exactly at max age boundary", () => {
      const boundary = new Date(Date.now() - MAX_PING_AGE_MS - 1000).toISOString()
      expect(isStale(boundary)).toBe(true)
    })

    it("should return false for a ping just under max age", () => {
      const justUnder = new Date(Date.now() - MAX_PING_AGE_MS + 5000).toISOString()
      expect(isStale(justUnder)).toBe(false)
    })

    it("should accept Date objects", () => {
      expect(isStale(new Date())).toBe(false)
      expect(isStale(new Date(Date.now() - 3_600_000))).toBe(true)
    })

    it("should use custom maxAgeMs when provided", () => {
      const fiveMinAgo = new Date(Date.now() - 300_000).toISOString()
      expect(isStale(fiveMinAgo, 600_000)).toBe(false) // 10 min max
      expect(isStale(fiveMinAgo, 120_000)).toBe(true) // 2 min max
    })
  })

  describe("formatLocationStatus", () => {
    it("should return 'unavailable' when no ping exists", () => {
      const status = formatLocationStatus(null, null, null)
      expect(status).toContain("Location unavailable")
    })

    it("should show location with geocode data when fresh", () => {
      const ping = {
        latitude: 31.52,
        longitude: 74.36,
        recorded_at: new Date().toISOString(),
        speed_kmh: 60,
      }
      const geo = { displayName: "near Lahore", city: "Lahore", source: "nominatim" }
      const status = formatLocationStatus(ping, null, geo)
      expect(status).toContain("near Lahore")
    })

    it("should show 'may be outdated' for stale pings", () => {
      const ping = {
        latitude: 31.52,
        longitude: 74.36,
        recorded_at: new Date(Date.now() - 3_600_000).toISOString(), // 1 hour ago
      }
      const geo = { displayName: "near Lahore", city: "Lahore", source: "nominatim" }
      const status = formatLocationStatus(ping, null, geo)
      expect(status).toContain("may be outdated")
    })

    it("should include ETA when route data is available", () => {
      const ping = {
        latitude: 31.0,
        longitude: 74.0,
        recorded_at: new Date().toISOString(),
      }
      const route = { distanceKm: 63, durationMin: 70, geometry: { type: "LineString", coordinates: [] }, source: "osrm" }
      const geo = { displayName: "near Sheikhupura", city: "Sheikhupura", source: "nominatim" }
      const status = formatLocationStatus(ping, route, geo)
      expect(status).toContain("63 km")
      expect(status).toContain("ETA")
    })

    it("should show coordinate fallback when geocode has no city/road", () => {
      const ping = {
        latitude: 30.157,
        longitude: 71.525,
        recorded_at: new Date().toISOString(),
      }
      const geo = { displayName: "30.157, 71.525", source: "nominatim" }
      const status = formatLocationStatus(ping, null, geo)
      expect(status).toContain("at")
    })
  })
})
