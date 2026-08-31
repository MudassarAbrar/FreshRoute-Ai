/**
 * Transport & Storage Provider Selection (Task 7)
 *
 * Formal eligibility filter + weighted scoring for transport and storage providers.
 */
import { CITY_DISTANCES_KM, PROVIDER_MATCH_WEIGHTS, TRANSPORTERS, STORAGES } from "@/data/market"
import { fetchTransporterProfiles, fetchStorageProviderProfiles } from "@/lib/db"
import type { Lot, Transporter, StorageFacility } from "@/types"

export interface ScoredProvider<T> {
  provider: T
  score: number
  breakdown: Record<string, number>
  eligible: boolean
  ineligibilityReason?: string
}

export interface TransportMatchInput {
  lot: Lot
  destCity: string
  pickupWindow: string
}

export interface StorageMatchInput {
  lot: Lot
  neededDays: number
}

export function rankTransporters(input: TransportMatchInput): ScoredProvider<Transporter>[] {
  const dist = CITY_DISTANCES_KM[input.lot.location]?.[input.destCity] ?? 350
  const w = PROVIDER_MATCH_WEIGHTS

  return TRANSPORTERS.map((t) => {
    const softProduce = ["Tomato", "Mango", "Banana", "Leafy Vegetables"].includes(input.lot.crop)
    const needsRefrigerated = softProduce && dist > 300
    if (needsRefrigerated && !t.refrigerated) {
      return { provider: t, score: 0, breakdown: {}, eligible: false, ineligibilityReason: `Refrigerated required for ${input.lot.crop} over ${dist}km` }
    }

    const cost = t.costPerKm * dist
    const maxCost = Math.max(...TRANSPORTERS.map((x) => x.costPerKm * dist))
    const costScore = maxCost > 0 ? 1 - cost / maxCost : 1
    const proximityScore = 0.9
    const ratingScore = t.onTimePct / 100
    const capabilityMatch = t.refrigerated ? 1.0 : softProduce ? 0.6 : 0.9
    const spoilageRisk = t.refrigerated ? 0.1 : softProduce ? 0.4 : 0.2

    const rawScore = w.cost * costScore + w.proximity * proximityScore + w.rating * ratingScore + w.capabilityMatch * capabilityMatch - w.spoilageRisk * spoilageRisk
    return { provider: t, score: Math.max(0, Math.round(rawScore * 1000) / 1000), breakdown: { cost: costScore, proximity: proximityScore, rating: ratingScore, capability: capabilityMatch, spoilageRisk }, eligible: true }
  }).sort((a, b) => b.score - a.score)
}

/**
 * Rank real transporters from DB (Phase 2).
 * Fetches transporter profiles, converts to Transporter shape, and scores.
 */
export async function rankTransportersAsync(input: TransportMatchInput): Promise<ScoredProvider<Transporter>[]> {
  const profiles = await fetchTransporterProfiles()
  if (profiles.length === 0) return rankTransporters(input) // fallback to hardcoded
  const transporters: Transporter[] = profiles.map((p) => ({
    id: p.userId,
    name: p.name,
    vehicle: p.vehicleType ?? "Unknown",
    refrigerated: p.refrigerated ?? false,
    costPerKm: p.ratePerKm ?? 30,
    onTimePct: p.onTimePct ?? 75,
  }))
  return rankTransportersFrom(transporters, input)
}

/** Internal: rank a given transporter array using the scoring formula */
function rankTransportersFrom(transporters: Transporter[], input: TransportMatchInput): ScoredProvider<Transporter>[] {
  const dist = CITY_DISTANCES_KM[input.lot.location]?.[input.destCity] ?? 350
  const w = PROVIDER_MATCH_WEIGHTS

  return transporters.map((t) => {
    const softProduce = ["Tomato", "Mango", "Banana", "Leafy Vegetables"].includes(input.lot.crop)
    const needsRefrigerated = softProduce && dist > 300
    if (needsRefrigerated && !t.refrigerated) {
      return { provider: t, score: 0, breakdown: {}, eligible: false, ineligibilityReason: `Refrigerated required for ${input.lot.crop} over ${dist}km` }
    }

    const cost = t.costPerKm * dist
    const maxCost = Math.max(...transporters.map((x) => x.costPerKm * dist))
    const costScore = maxCost > 0 ? 1 - cost / maxCost : 1
    const proximityScore = 0.9
    const ratingScore = t.onTimePct / 100
    const capabilityMatch = t.refrigerated ? 1.0 : softProduce ? 0.6 : 0.9
    const spoilageRisk = t.refrigerated ? 0.1 : softProduce ? 0.4 : 0.2

    const rawScore = w.cost * costScore + w.proximity * proximityScore + w.rating * ratingScore + w.capabilityMatch * capabilityMatch - w.spoilageRisk * spoilageRisk
    return { provider: t, score: Math.max(0, Math.round(rawScore * 1000) / 1000), breakdown: { cost: costScore, proximity: proximityScore, rating: ratingScore, capability: capabilityMatch, spoilageRisk }, eligible: true }
  }).sort((a, b) => b.score - a.score)
}

export function rankStorageProviders(input: StorageMatchInput): ScoredProvider<StorageFacility>[] {
  const w = PROVIDER_MATCH_WEIGHTS

  return STORAGES.map((s) => {
    const sameCity = s.city === input.lot.location
    if (!sameCity) {
      return { provider: s, score: 0, breakdown: {}, eligible: false, ineligibilityReason: `Storage not in ${input.lot.location}` }
    }

    const costScore = Math.max(0, 1 - s.perKgPerDay / 10)
    const proximityScore = 1.0
    const ratingScore = s.verified ? 0.95 : 0.6
    const capabilityMatch = s.tempC <= 8 ? 1.0 : 0.7
    const spoilageRisk = s.tempC <= 4 ? 0.1 : s.tempC <= 8 ? 0.2 : 0.4

    const rawScore = w.cost * costScore + w.proximity * proximityScore + w.rating * ratingScore + w.capabilityMatch * capabilityMatch - w.spoilageRisk * spoilageRisk
    return { provider: s, score: Math.max(0, Math.round(rawScore * 1000) / 1000), breakdown: { cost: costScore, proximity: proximityScore, rating: ratingScore, capability: capabilityMatch, spoilageRisk }, eligible: true }
  }).sort((a, b) => b.score - a.score)
}

/**
 * Rank real storage providers from DB (Phase 2).
 * Fetches storage profiles, converts to StorageFacility shape, and scores.
 */
export async function rankStorageProvidersAsync(input: StorageMatchInput): Promise<ScoredProvider<StorageFacility>[]> {
  const profiles = await fetchStorageProviderProfiles()
  if (profiles.length === 0) return rankStorageProviders(input) // fallback to hardcoded
  const storages: StorageFacility[] = profiles.map((p) => ({
    id: p.userId,
    name: p.name,
    city: p.city ?? "",
    tempC: p.tempRange?.max ?? 8,
    perKgPerDay: p.perKgPerDay ?? 3.5,
    verified: p.verified ?? false,
  }))
  return rankStorageProvidersFrom(storages, input)
}

/** Internal: rank a given storage array using the scoring formula */
function rankStorageProvidersFrom(storages: StorageFacility[], input: StorageMatchInput): ScoredProvider<StorageFacility>[] {
  const w = PROVIDER_MATCH_WEIGHTS

  return storages.map((s) => {
    const sameCity = s.city === input.lot.location
    if (!sameCity) {
      return { provider: s, score: 0, breakdown: {}, eligible: false, ineligibilityReason: `Storage not in ${input.lot.location}` }
    }

    const costScore = Math.max(0, 1 - s.perKgPerDay / 10)
    const proximityScore = 1.0
    const ratingScore = s.verified ? 0.95 : 0.6
    const capabilityMatch = s.tempC <= 8 ? 1.0 : 0.7
    const spoilageRisk = s.tempC <= 4 ? 0.1 : s.tempC <= 8 ? 0.2 : 0.4

    const rawScore = w.cost * costScore + w.proximity * proximityScore + w.rating * ratingScore + w.capabilityMatch * capabilityMatch - w.spoilageRisk * spoilageRisk
    return { provider: s, score: Math.max(0, Math.round(rawScore * 1000) / 1000), breakdown: { cost: costScore, proximity: proximityScore, rating: ratingScore, capability: capabilityMatch, spoilageRisk }, eligible: true }
  }).sort((a, b) => b.score - a.score)
}
