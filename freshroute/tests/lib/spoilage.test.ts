/**
 * Baseline tests for the spoilage risk engine.
 *
 * Verifies the exponential decay model, risk classification,
 * contributing factors, and edge cases.
 */
import { describe, it, expect } from "vitest"
import { calculateSpoilage, type SpoilageInput } from "@/lib/spoilage"

/** Helper to create a basic spoilage input with sensible defaults */
function makeInput(overrides: Partial<SpoilageInput> = {}): SpoilageInput {
  return {
    commodity: "Tomato",
    harvestDate: "tomorrow",
    expectedWaitHours: 24,
    transportMode: "ambient",
    weatherForecast: { tempC: 35 },
    handlingEvents: 1,
    ...overrides,
  }
}

describe("calculateSpoilage", () => {
  describe("basic exponential decay", () => {
    it("should return a loss between 0 and 0.50 (cap)", () => {
      const result = calculateSpoilage(makeInput())
      expect(result.expectedLossPct).toBeGreaterThanOrEqual(0)
      expect(result.expectedLossPct).toBeLessThanOrEqual(0.50)
    })

    it("should return a valid risk score", () => {
      const result = calculateSpoilage(makeInput())
      expect(["Low", "Medium", "High"]).toContain(result.riskScore)
    })

    it("should return contributing factors with all keys", () => {
      const result = calculateSpoilage(makeInput())
      expect(result.contributingFactors).toHaveProperty("baseDecay")
      expect(result.contributingFactors).toHaveProperty("temp")
      expect(result.contributingFactors).toHaveProperty("handling")
      expect(result.contributingFactors).toHaveProperty("transport")
    })

    it("should return recommended action window capped at 72 hours", () => {
      const result = calculateSpoilage(makeInput())
      expect(result.recommendedActionWindowHours).toBeGreaterThan(0)
      expect(result.recommendedActionWindowHours).toBeLessThanOrEqual(72)
    })
  })

  describe("risk classification thresholds", () => {
    it("should classify very short wait as Low risk", () => {
      const result = calculateSpoilage(makeInput({ expectedWaitHours: 1, transportMode: "refrigerated" }))
      expect(result.riskScore).toBe("Low")
    })

    it("should classify long ambient wait as High risk", () => {
      const result = calculateSpoilage(makeInput({
        expectedWaitHours: 72,
        transportMode: "ambient",
        weatherForecast: { tempC: 42 },
      }))
      expect(result.riskScore).toBe("High")
    })
  })

  describe("commodity sensitivity", () => {
    it("should show higher loss for Leafy Vegetables than Potato (decay rate)", () => {
      const leafy = calculateSpoilage(makeInput({ commodity: "Leafy Vegetables", expectedWaitHours: 24 }))
      const potato = calculateSpoilage(makeInput({ commodity: "Potato", expectedWaitHours: 24 }))
      expect(leafy.expectedLossPct).toBeGreaterThan(potato.expectedLossPct)
    })

    it("should show higher loss for Banana than Kinnow", () => {
      const banana = calculateSpoilage(makeInput({ commodity: "Banana", expectedWaitHours: 24 }))
      const kinnow = calculateSpoilage(makeInput({ commodity: "Kinnow", expectedWaitHours: 24 }))
      expect(banana.expectedLossPct).toBeGreaterThan(kinnow.expectedLossPct)
    })

    it("should handle unknown commodity with default decay rate", () => {
      const result = calculateSpoilage(makeInput({ commodity: "DragonFruit" }))
      expect(result.expectedLossPct).toBeGreaterThan(0)
    })
  })

  describe("transport mode effects", () => {
    it("refrigerated should produce less loss than ambient", () => {
      const reefer = calculateSpoilage(makeInput({ transportMode: "refrigerated" }))
      const ambient = calculateSpoilage(makeInput({ transportMode: "ambient" }))
      expect(reefer.expectedLossPct).toBeLessThan(ambient.expectedLossPct)
    })

    it("'none' mode should produce the highest loss", () => {
      const none = calculateSpoilage(makeInput({ transportMode: "none" }))
      const ambient = calculateSpoilage(makeInput({ transportMode: "ambient" }))
      expect(none.expectedLossPct).toBeGreaterThanOrEqual(ambient.expectedLossPct)
    })
  })

  describe("temperature effects", () => {
    it("higher temperature should increase loss for ambient transport", () => {
      const cool = calculateSpoilage(makeInput({ weatherForecast: { tempC: 20 } }))
      const hot = calculateSpoilage(makeInput({ weatherForecast: { tempC: 45 } }))
      expect(hot.expectedLossPct).toBeGreaterThan(cool.expectedLossPct)
    })

    it("refrigerated transport ignores weather temperature", () => {
      const cool = calculateSpoilage(makeInput({ transportMode: "refrigerated", weatherForecast: { tempC: 20 } }))
      const hot = calculateSpoilage(makeInput({ transportMode: "refrigerated", weatherForecast: { tempC: 45 } }))
      // Both should be identical since refrigerated assumes ideal temp
      expect(cool.expectedLossPct).toBe(hot.expectedLossPct)
    })
  })

  describe("handling events", () => {
    it("more handling events should increase loss", () => {
      const one = calculateSpoilage(makeInput({ handlingEvents: 1 }))
      const five = calculateSpoilage(makeInput({ handlingEvents: 5 }))
      expect(five.expectedLossPct).toBeGreaterThan(one.expectedLossPct)
    })

    it("zero handling events should produce minimum handling factor", () => {
      const result = calculateSpoilage(makeInput({ handlingEvents: 0 }))
      expect(result.contributingFactors.handling).toBe(1) // Math.pow(1.03, 0) = 1
    })
  })

  describe("time dependency", () => {
    it("longer wait should produce higher loss", () => {
      const short = calculateSpoilage(makeInput({ expectedWaitHours: 6 }))
      const long = calculateSpoilage(makeInput({ expectedWaitHours: 48 }))
      expect(long.expectedLossPct).toBeGreaterThan(short.expectedLossPct)
    })

    it("zero wait hours should produce near-zero loss", () => {
      const result = calculateSpoilage(makeInput({ expectedWaitHours: 0 }))
      expect(result.expectedLossPct).toBe(0)
    })
  })

  describe("loss cap at 50%", () => {
    it("should never exceed 0.50 even with extreme inputs", () => {
      const result = calculateSpoilage(makeInput({
        commodity: "Leafy Vegetables",
        expectedWaitHours: 200,
        transportMode: "none",
        weatherForecast: { tempC: 50 },
        handlingEvents: 10,
      }))
      expect(result.expectedLossPct).toBeLessThanOrEqual(0.50)
    })
  })
})
