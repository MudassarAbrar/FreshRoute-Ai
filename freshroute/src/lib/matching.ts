/**
 * Buyer Marketplace Matching Service (Task 6)
 *
 * Scores lot-to-buyer_request pairs using a weighted formula:
 *   score = w1*priceFit + w2*quantityFit + w3*proximity + w4*reliability + w5*urgency
 */
import { CITY_DISTANCES_KM, MATCH_WEIGHTS } from "@/data/cropReference"
import { fetchBuyerProfiles } from "@/lib/db"
import type { Listing, Lot } from "@/types"

export interface MatchInput {
  lotListingId: string
  lot: Lot
}

export interface MatchResult {
  buyerRequestId: string
  buyerUserId: string
  buyerName: string
  score: number
  breakdown: {
    priceFit: number
    quantityFit: number
    proximityScore: number
    buyerReliability: number
    urgencyAlignment: number
  }
}

/**
 * Score how well a lot matches a buyer_request listing.
 */
function scoreMatch(lot: Lot, buyerRequest: Listing): MatchResult {
  const attrs = buyerRequest.attributes ?? {}
  const reqGrade = (attrs.grade as string) ?? "any"
  const reqCeiling = (attrs.priceCeiling as number) ?? Infinity
  const reqRegion = (attrs.deliveryRegion as string) ?? buyerRequest.locationGeo
  const neededBy = attrs.neededBy as string | undefined

  // Price fit: how close is lot price to buyer's ceiling (1.0 = exact match, 0.0 = way over)
  const lotPrice = lot.crop ? 80 : 80 // approximate market price
  const priceFit = reqCeiling === Infinity
    ? 0.8
    : Math.max(0, Math.min(1, 1 - Math.abs(lotPrice - reqCeiling) / reqCeiling))

  // Quantity fit: how well lot quantity matches buyer's request
  const qtyRatio = Math.min(lot.quantityKg, buyerRequest.quantity) / Math.max(lot.quantityKg, buyerRequest.quantity)
  const quantityFit = qtyRatio

  // Proximity: distance between lot location and buyer's delivery region
  const dist = CITY_DISTANCES_KM[lot.location]?.[reqRegion] ?? 500
  const proximityScore = Math.max(0, 1 - dist / 1000) // Normalize 0-1000km to 0-1

  // Buyer reliability: default 0.8 for marketplace buyers (no historical data yet)
  const buyerReliability = 0.8

  // Urgency alignment: if buyer needs it soon and lot is ready soon, higher score
  let urgencyAlignment = 0.7 // default
  if (neededBy) {
    const daysUntilNeeded = Math.max(1, (new Date(neededBy).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    const lotReadyDays = lot.readyDate === "today" ? 0 : lot.readyDate === "tomorrow" ? 1 : 3
    urgencyAlignment = daysUntilNeeded >= lotReadyDays ? 1.0 : Math.max(0, 1 - (lotReadyDays - daysUntilNeeded) / 7)
  }

  // Grade compatibility check
  const gradeCompatible = reqGrade === "any" || reqGrade >= lot.vision.grade

  // Weighted score
  const w = MATCH_WEIGHTS
  const rawScore = w.priceFit * priceFit + w.quantityFit * quantityFit + w.proximity * proximityScore + w.reliability * buyerReliability + w.urgency * urgencyAlignment

  // Zero out if grade incompatible
  const score = gradeCompatible ? Math.round(rawScore * 1000) / 1000 : 0

  return {
    buyerRequestId: buyerRequest.id,
    buyerUserId: buyerRequest.ownerUserId,
    buyerName: buyerRequest.ownerUserId, // In production, join with profiles
    score,
    breakdown: {
      priceFit: Math.round(priceFit * 100) / 100,
      quantityFit: Math.round(quantityFit * 100) / 100,
      proximityScore: Math.round(proximityScore * 100) / 100,
      buyerReliability: Math.round(buyerReliability * 100) / 100,
      urgencyAlignment: Math.round(urgencyAlignment * 100) / 100,
    },
  }
}

/**
 * Rank a lot against all available buyer_request listings.
 */
export function matchLotToBuyers(input: MatchInput, buyerRequests: Listing[]): MatchResult[] {
  return buyerRequests
    .map((br) => scoreMatch(input.lot, br))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * Match lot against real buyer profiles from the database (Phase 2).
 * Fetches buyer profiles, converts to Listing-compatible shape, and
 * delegates to the existing scoring formula.
 */
export async function matchLotToRealBuyers(lot: Lot): Promise<MatchResult[]> {
  const buyers = await fetchBuyerProfiles({ commodity: lot.crop })
  const buyerRequests: Listing[] = buyers.map((b) => ({
    id: b.userId,
    ownerUserId: b.userId,
    listingType: "buyer_request" as const,
    commodity: b.typicalCommodities?.[0] ?? lot.crop,
    quantity: (b.minKg ?? 200 + b.maxKg ?? 5000) / 2,
    unit: "kg",
    locationGeo: b.city,
    price: b.priceCeiling ?? null,
    availableFrom: null,
    availableTo: null,
    attributes: {
      grade: "any" as const,
      priceCeiling: b.priceCeiling ?? Infinity,
      deliveryRegion: b.deliveryRegions?.[0] ?? b.city,
    },
    status: "active",
    createdAt: new Date().toISOString(),
  }))
  return matchLotToBuyers({ lotListingId: "", lot }, buyerRequests)
}
