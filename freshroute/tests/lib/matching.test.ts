/**
 * Baseline tests for the buyer matching scoring engine.
 *
 * Verifies weighted scoring, grade compatibility filtering,
 * and ranking order.
 */
import { describe, it, expect } from "vitest"
import { matchLotToBuyers, type MatchResult } from "@/lib/matching"
import type { Listing, Lot } from "@/types"

/** Helper to create a test lot */
function makeLot(overrides: Partial<Lot> = {}): Lot {
  return {
    crop: "Tomato",
    quantityKg: 800,
    location: "Multan",
    readyDate: "tomorrow",
    packaging: "crates",
    storageAvailable: false,
    departEarly: true,
    photos: [],
    vision: {
      grade: "B",
      ripeness: "medium",
      defectRate: 0.08,
      notes: [],
      confidence: 0.85,
      source: "gemini",
    },
    confidence: { crop: 0.9, quantity: 0.9, location: 0.95, overall: 0.92 },
    ...overrides,
  }
}

/** Helper to create a buyer request listing */
function makeBuyerRequest(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "br-1",
    ownerUserId: "buyer-1",
    listingType: "buyer_request",
    commodity: "Tomato",
    quantity: 800,
    unit: "kg",
    locationGeo: "Lahore",
    price: null,
    availableFrom: null,
    availableTo: null,
    attributes: {
      grade: "any",
      priceCeiling: Infinity,
      deliveryRegion: "Lahore",
    },
    status: "active",
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("matchLotToBuyers", () => {
  it("should return results sorted by score (descending)", () => {
    const lot = makeLot()
    const buyers: Listing[] = [
      makeBuyerRequest({ id: "br-far", locationGeo: "Karachi", attributes: { grade: "any", deliveryRegion: "Karachi" } }),
      makeBuyerRequest({ id: "br-near", locationGeo: "Multan", attributes: { grade: "any", deliveryRegion: "Multan" } }),
    ]

    const results = matchLotToBuyers({ lotListingId: "l1", lot }, buyers)
    expect(results.length).toBeGreaterThanOrEqual(1)
    // Results should be sorted by score descending
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  it("should give higher proximity score to nearby buyers", () => {
    const lot = makeLot({ location: "Multan" })
    const nearBuyer = makeBuyerRequest({
      id: "br-near",
      attributes: { grade: "any", deliveryRegion: "Multan" },
    })
    const farBuyer = makeBuyerRequest({
      id: "br-far",
      attributes: { grade: "any", deliveryRegion: "Karachi" },
    })

    const results = matchLotToBuyers({ lotListingId: "l1", lot }, [nearBuyer, farBuyer])
    const nearResult = results.find((r) => r.buyerRequestId === "br-near")
    const farResult = results.find((r) => r.buyerRequestId === "br-far")

    expect(nearResult).toBeDefined()
    expect(farResult).toBeDefined()
    expect(nearResult!.breakdown.proximityScore).toBeGreaterThan(farResult!.breakdown.proximityScore)
  })

  it("should zero out score when grade is incompatible", () => {
    const lot = makeLot({ vision: { grade: "C", ripeness: "medium", defectRate: 0.2, notes: [], confidence: 0.7, source: "demo" } })
    const strictBuyer = makeBuyerRequest({
      id: "br-strict",
      attributes: { grade: "A", deliveryRegion: "Lahore" },
    })

    const results = matchLotToBuyers({ lotListingId: "l1", lot }, [strictBuyer])
    // Grade C lot should be zeroed out for a Grade A-only buyer
    const strict = results.find((r) => r.buyerRequestId === "br-strict")
    // Either filtered out (score=0 filtered) or score=0
    if (strict) {
      expect(strict.score).toBe(0)
    }
  })

  it("should allow grade-compatible matches", () => {
    const lot = makeLot({ vision: { grade: "A", ripeness: "medium", defectRate: 0.05, notes: [], confidence: 0.9, source: "gemini" } })
    const buyer = makeBuyerRequest({
      attributes: { grade: "A", deliveryRegion: "Lahore" },
    })

    const results = matchLotToBuyers({ lotListingId: "l1", lot }, [buyer])
    expect(results.length).toBe(1)
    expect(results[0].score).toBeGreaterThan(0)
  })

  it("should handle empty buyer list", () => {
    const results = matchLotToBuyers({ lotListingId: "l1", lot: makeLot() }, [])
    expect(results).toEqual([])
  })

  it("should compute all breakdown fields", () => {
    const lot = makeLot()
    const buyer = makeBuyerRequest()

    const results = matchLotToBuyers({ lotListingId: "l1", lot }, [buyer])
    expect(results.length).toBe(1)

    const breakdown = results[0].breakdown
    expect(breakdown.priceFit).toBeGreaterThanOrEqual(0)
    expect(breakdown.quantityFit).toBeGreaterThan(0)
    expect(breakdown.proximityScore).toBeGreaterThanOrEqual(0)
    expect(breakdown.buyerReliability).toBeGreaterThan(0)
    expect(breakdown.urgencyAlignment).toBeGreaterThan(0)
  })

  it("quantity fit should be 1.0 when lot and request quantities match exactly", () => {
    const lot = makeLot({ quantityKg: 500 })
    const buyer = makeBuyerRequest({ quantity: 500 })

    const results = matchLotToBuyers({ lotListingId: "l1", lot }, [buyer])
    expect(results[0].breakdown.quantityFit).toBe(1)
  })

  it("should filter out zero-score matches", () => {
    const lot = makeLot({ vision: { grade: "C", ripeness: "medium", defectRate: 0.25, notes: [], confidence: 0.6, source: "demo" } })
    const strictBuyer = makeBuyerRequest({
      id: "br-strict",
      attributes: { grade: "A", deliveryRegion: "Lahore" },
    })
    const openBuyer = makeBuyerRequest({
      id: "br-open",
      attributes: { grade: "any", deliveryRegion: "Lahore" },
    })

    const results = matchLotToBuyers({ lotListingId: "l1", lot }, [strictBuyer, openBuyer])
    // The strict buyer should be filtered out (score=0)
    expect(results.find((r) => r.buyerRequestId === "br-strict")).toBeUndefined()
    // The open buyer should still appear
    expect(results.find((r) => r.buyerRequestId === "br-open")).toBeDefined()
  })
})
