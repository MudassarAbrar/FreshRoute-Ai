/**
 * Baseline tests for the client-side token bucket rate limiter.
 *
 * Verifies token consumption, refill, and limit enforcement
 * for both agent interactions (30/hr) and order actions (5/order).
 */
import { describe, it, expect, beforeEach } from "vitest"
import { checkAgentInteraction, checkOrderAction } from "@/lib/rateLimiter"

describe("rateLimiter", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe("checkAgentInteraction (30/hour)", () => {
    it("should allow the first interaction", () => {
      const result = checkAgentInteraction("user-1")
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(29)
    })

    it("should decrement remaining on each call", () => {
      checkAgentInteraction("user-1")
      checkAgentInteraction("user-1")
      const third = checkAgentInteraction("user-1")
      expect(third.remaining).toBe(27)
    })

    it("should exhaust 30 tokens and then deny", () => {
      let lastResult = checkAgentInteraction("user-exhaust")
      for (let i = 1; i < 30; i++) {
        lastResult = checkAgentInteraction("user-exhaust")
      }
      expect(lastResult.allowed).toBe(true)
      expect(lastResult.remaining).toBe(0)

      // 31st call should be denied
      const denied = checkAgentInteraction("user-exhaust")
      expect(denied.allowed).toBe(false)
      expect(denied.remaining).toBe(0)
      expect(denied.retryAfterMs).toBeDefined()
      expect(denied.retryAfterMs!).toBeGreaterThan(0)
    })

    it("should track users independently", () => {
      // Exhaust user-a
      for (let i = 0; i < 30; i++) {
        checkAgentInteraction("user-a")
      }
      const denied = checkAgentInteraction("user-a")
      expect(denied.allowed).toBe(false)

      // user-b should still be allowed
      const allowed = checkAgentInteraction("user-b")
      expect(allowed.allowed).toBe(true)
    })

    it("should refill tokens over time", () => {
      // Exhaust all tokens
      for (let i = 0; i < 30; i++) {
        checkAgentInteraction("user-refill")
      }
      expect(checkAgentInteraction("user-refill").allowed).toBe(false)

      // Simulate time passing by manipulating the stored bucket
      const key = "freshroute_ratelimit_agent_user-refill"
      const stored = JSON.parse(localStorage.getItem(key)!)
      stored.lastRefill = Date.now() - 3600_000 // 1 hour ago
      localStorage.setItem(key, JSON.stringify(stored))

      // Should have refilled ~30 tokens (30/hr)
      const result = checkAgentInteraction("user-refill")
      expect(result.allowed).toBe(true)
    })
  })

  describe("checkOrderAction (5/order)", () => {
    it("should allow the first action", () => {
      const result = checkOrderAction("order-1")
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it("should exhaust 5 tokens and then deny", () => {
      for (let i = 0; i < 5; i++) {
        checkOrderAction("order-exhaust")
      }
      const denied = checkOrderAction("order-exhaust")
      expect(denied.allowed).toBe(false)
      expect(denied.remaining).toBe(0)
    })

    it("should track orders independently", () => {
      for (let i = 0; i < 5; i++) {
        checkOrderAction("order-a")
      }
      expect(checkOrderAction("order-a").allowed).toBe(false)
      expect(checkOrderAction("order-b").allowed).toBe(true)
    })

    it("should provide retryAfterMs when denied", () => {
      for (let i = 0; i < 5; i++) {
        checkOrderAction("order-retry")
      }
      const denied = checkOrderAction("order-retry")
      expect(denied.allowed).toBe(false)
      expect(denied.retryAfterMs).toBeGreaterThan(0)
    })
  })

  describe("edge cases", () => {
    it("should handle corrupt localStorage data gracefully", () => {
      localStorage.setItem("freshroute_ratelimit_agent_user-corrupt", "not-valid-json{")
      const result = checkAgentInteraction("user-corrupt")
      // Should fall through to fresh bucket
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(29)
    })

    it("should handle missing localStorage gracefully", () => {
      // localStorage is mocked but empty
      const result = checkAgentInteraction("user-new")
      expect(result.allowed).toBe(true)
    })
  })
})
