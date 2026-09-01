/**
 * Baseline tests for the anti-fabrication validator.
 *
 * Verifies that claims without evidence are detected and replaced
 * with honest status text.
 */
import { describe, it, expect } from "vitest"
import { detectClaims, validateClaim, sanitizeResponse } from "@/lib/antiFabrication"

describe("antiFabrication", () => {
  describe("detectClaims", () => {
    it("should detect 'offer sent' claims", () => {
      const claims = detectClaims("Offer sent to Alkaram on WhatsApp ✓")
      expect(claims.length).toBeGreaterThan(0)
      expect(claims[0].claimType).toBe("offer_sent")
    })

    it("should detect 'WhatsApp message delivered' claims", () => {
      const claims = detectClaims("WhatsApp message delivered ✓")
      expect(claims.length).toBeGreaterThan(0)
      expect(claims.some((c) => c.claimType === "whatsapp_delivered")).toBe(true)
    })

    it("should detect 'read receipt received' claims", () => {
      const claims = detectClaims("read receipt received")
      expect(claims.length).toBeGreaterThan(0)
      expect(claims[0].claimType).toBe("message_read")
    })

    it("should detect 'transport booked' claims", () => {
      const claims = detectClaims("Transport booked ✓")
      expect(claims.length).toBeGreaterThan(0)
      expect(claims[0].claimType).toBe("booking_confirmed")
    })

    it("should detect 'truck dispatched' claims", () => {
      const claims = detectClaims("Truck dispatched and en route")
      expect(claims.length).toBeGreaterThan(0)
      expect(claims[0].claimType).toBe("truck_dispatched")
    })

    it("should detect 'payment completed' claims", () => {
      const claims = detectClaims("Payment completed successfully ✓")
      expect(claims.length).toBeGreaterThan(0)
      expect(claims[0].claimType).toBe("payment_completed")
    })

    it("should return empty for honest text without claims", () => {
      const claims = detectClaims("Here are your sale options. I recommend selling locally.")
      expect(claims).toHaveLength(0)
    })

    it("should detect multiple claims in a single message", () => {
      const text = "Offer sent to buyer ✓ and transport booked ✓"
      const claims = detectClaims(text)
      expect(claims.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe("validateClaim", () => {
    it("should reject claim when no matching tool result exists", () => {
      const result = validateClaim(
        { claimType: "offer_sent", phrase: "Offer sent" },
        [], // no tool results
      )
      expect(result.valid).toBe(false)
      expect(result.replacement).toBeDefined()
    })

    it("should accept claim when matching successful tool result exists", () => {
      const result = validateClaim(
        { claimType: "offer_sent", phrase: "Offer sent to buyer" },
        [{ name: "send_offer_message", result: { ok: true, offerId: "o1" } }],
      )
      expect(result.valid).toBe(true)
    })

    it("should reject claim when tool result indicates failure", () => {
      const result = validateClaim(
        { claimType: "booking_confirmed", phrase: "Transport booked" },
        [{ name: "book_transport", result: { error: "No transporter available" } }],
      )
      expect(result.valid).toBe(false)
    })

    it("should always reject payment_completed (no tool exists yet)", () => {
      const result = validateClaim(
        { claimType: "payment_completed", phrase: "Payment completed" },
        [{ name: "some_other_tool", result: { ok: true } }],
      )
      expect(result.valid).toBe(false)
    })

    it("should always reject message_read (no tool exists yet)", () => {
      const result = validateClaim(
        { claimType: "message_read", phrase: "Read receipt received" },
        [{ name: "send_offer_message", result: { ok: true } }],
      )
      expect(result.valid).toBe(false)
    })
  })

  describe("sanitizeResponse", () => {
    it("should replace unverified claims with honest text", () => {
      const { text, claimsFound, claimsReplaced } = sanitizeResponse(
        "Offer sent to Alkaram on WhatsApp ✓ and transport booked ✓",
        [], // no tool results
      )
      expect(claimsFound).toBeGreaterThan(0)
      expect(claimsReplaced).toBeGreaterThan(0)
      expect(text).not.toContain("Offer sent")
      expect(text).not.toContain("transport booked")
    })

    it("should preserve verified claims", () => {
      const { text, claimsReplaced } = sanitizeResponse(
        "Offer sent to Alkaram on WhatsApp ✓",
        [{ name: "send_offer_message", result: { ok: true } }],
      )
      // The verified claim should remain
      expect(claimsReplaced).toBe(0)
      expect(text).toContain("Offer sent")
    })

    it("should not modify honest text", () => {
      const honest = "Here are your options. The local mandi price is 80 PKR/kg."
      const { text, claimsFound, claimsReplaced } = sanitizeResponse(honest, [])
      expect(text).toBe(honest)
      expect(claimsFound).toBe(0)
      expect(claimsReplaced).toBe(0)
    })

    it("should handle mixed verified and unverified claims", () => {
      const { text, claimsFound, claimsReplaced } = sanitizeResponse(
        "Offer sent to buyer ✓ and payment completed ✓",
        [{ name: "send_offer_message", result: { ok: true } }],
      )
      expect(claimsFound).toBeGreaterThanOrEqual(1)
      // offer_sent is verified, payment_completed is not
      expect(text).toContain("Offer sent")
      expect(text).not.toContain("payment completed")
    })
  })
})
