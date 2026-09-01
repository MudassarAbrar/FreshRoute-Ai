/**
 * Baseline tests for the circuit breaker.
 *
 * Verifies closed → open → half-open → closed lifecycle,
 * failure counting, fallback behavior, and reset.
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { withCircuitBreaker, resetCircuit, getCircuitState } from "@/lib/circuitBreaker"

describe("circuitBreaker", () => {
  beforeEach(() => {
    resetCircuit("test-circuit")
  })

  describe("closed state (normal operation)", () => {
    it("should return fn result when successful", async () => {
      const wrapped = withCircuitBreaker(
        "test-circuit",
        async () => "success",
        () => "fallback",
      )
      const result = await wrapped()
      expect(result).toBe("success")
    })

    it("should stay closed after a single success", async () => {
      const wrapped = withCircuitBreaker(
        "test-circuit",
        async () => "ok",
        () => "fallback",
      )
      await wrapped()
      expect(getCircuitState("test-circuit")).toBe("closed")
    })

    it("should return fallback on single failure but stay closed", async () => {
      const wrapped = withCircuitBreaker(
        "test-circuit",
        async () => { throw new Error("fail") },
        () => "fallback",
      )
      const result = await wrapped()
      expect(result).toBe("fallback")
      expect(getCircuitState("test-circuit")).toBe("closed")
    })
  })

  describe("open state (after 3 consecutive failures)", () => {
    it("should open after 3 consecutive failures", async () => {
      const wrapped = withCircuitBreaker(
        "test-circuit",
        async () => { throw new Error("fail") },
        () => "fallback",
      )
      await wrapped() // failure 1
      await wrapped() // failure 2
      await wrapped() // failure 3 → opens

      expect(getCircuitState("test-circuit")).toBe("open")
    })

    it("should return fallback without calling fn when circuit is open", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("fail"))
      const fallback = vi.fn().mockReturnValue("fallback")
      const wrapped = withCircuitBreaker("test-circuit", fn, fallback)

      // Trip the circuit
      await wrapped()
      await wrapped()
      await wrapped()

      fn.mockClear()
      fallback.mockClear()

      // Next call should go straight to fallback
      const result = await wrapped()
      expect(result).toBe("fallback")
      expect(fn).not.toHaveBeenCalled()
      expect(fallback).toHaveBeenCalled()
    })
  })

  describe("half-open state (recovery attempt)", () => {
    it("should transition to half-open after recovery time", async () => {
      // Trip the circuit
      const wrapped = withCircuitBreaker(
        "test-circuit",
        async () => { throw new Error("fail") },
        () => "fallback",
      )
      await wrapped()
      await wrapped()
      await wrapped()
      expect(getCircuitState("test-circuit")).toBe("open")

      // Fast-forward time past recovery (60s)
      vi.useFakeTimers()
      vi.advanceTimersByTime(61_000)
      expect(getCircuitState("test-circuit")).toBe("half-open")
      vi.useRealTimers()
    })

    it("should close circuit on success during half-open", async () => {
      let shouldFail = true
      const wrapped = withCircuitBreaker(
        "test-circuit",
        async () => {
          if (shouldFail) throw new Error("fail")
          return "recovered"
        },
        () => "fallback",
      )

      // Trip the circuit
      await wrapped()
      await wrapped()
      await wrapped()

      // Fast-forward past recovery and stay in fake timers
      vi.useFakeTimers()
      vi.advanceTimersByTime(61_000)

      // Now succeed (still under fake timers so Date.now() is advanced)
      shouldFail = false
      const result = await wrapped()
      expect(result).toBe("recovered")
      expect(getCircuitState("test-circuit")).toBe("closed")
      vi.useRealTimers()
    })

    it("should re-open circuit on failure during half-open", async () => {
      const wrapped = withCircuitBreaker(
        "test-circuit",
        async () => { throw new Error("fail") },
        () => "fallback",
      )

      // Trip the circuit
      await wrapped()
      await wrapped()
      await wrapped()

      // Fast-forward past recovery
      vi.useFakeTimers()
      vi.advanceTimersByTime(61_000)
      vi.useRealTimers()

      // Fail again in half-open
      await wrapped()
      expect(getCircuitState("test-circuit")).toBe("open")
    })
  })

  describe("reset", () => {
    it("should reset circuit to closed state", async () => {
      const wrapped = withCircuitBreaker(
        "test-circuit",
        async () => { throw new Error("fail") },
        () => "fallback",
      )
      await wrapped()
      await wrapped()
      await wrapped()
      expect(getCircuitState("test-circuit")).toBe("open")

      resetCircuit("test-circuit")
      expect(getCircuitState("test-circuit")).toBe("closed")
    })
  })

  describe("reset on success", () => {
    it("should reset failure count after a success", async () => {
      let shouldFail = true
      const wrapped = withCircuitBreaker(
        "test-circuit",
        async () => {
          if (shouldFail) throw new Error("fail")
          return "ok"
        },
        () => "fallback",
      )

      // Two failures
      await wrapped()
      await wrapped()

      // Then a success — should reset count
      shouldFail = false
      await wrapped()
      expect(getCircuitState("test-circuit")).toBe("closed")

      // Now fail again — should need 3 more, not 1
      shouldFail = true
      await wrapped()
      expect(getCircuitState("test-circuit")).toBe("closed") // only 1 failure
    })
  })

  describe("independent circuits", () => {
    it("should track circuits independently", async () => {
      const a = withCircuitBreaker(
        "circuit-a",
        async () => { throw new Error("fail") },
        () => "fallback-a",
      )
      const b = withCircuitBreaker(
        "circuit-b",
        async () => "ok",
        () => "fallback-b",
      )

      // Trip circuit-a
      await a()
      await a()
      await a()

      expect(getCircuitState("circuit-a")).toBe("open")
      expect(getCircuitState("circuit-b")).toBe("closed")

      // Clean up
      resetCircuit("circuit-a")
      resetCircuit("circuit-b")
    })
  })
})
