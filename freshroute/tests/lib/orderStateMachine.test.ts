/**
 * Baseline tests for the order state machine.
 *
 * Verifies all 14 states, every legal transition, and illegal transition rejection.
 * DB functions are mocked so tests run without Supabase.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { OrderStatus } from "@/types"

// Mock DB functions before importing the module
vi.mock("@/lib/db", () => ({
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  addOrderEvent: vi.fn().mockResolvedValue(undefined),
}))

import { canTransition, getValidTransitions, transition } from "@/lib/orderStateMachine"
import { updateOrderStatus, addOrderEvent } from "@/lib/db"

/** All 14 valid order statuses */
const ALL_STATUSES: OrderStatus[] = [
  "LISTED", "OFFER_RECEIVED", "OFFER_ACCEPTED",
  "TRANSPORT_PENDING", "TRANSPORT_BOOKED",
  "STORAGE_PENDING", "STORAGE_BOOKED",
  "IN_TRANSIT", "DELIVERED",
  "PAYMENT_PENDING", "PAID", "CLOSED",
  "CANCELLED", "DISPUTED",
]

/** Known legal transitions (from orderStateMachine.ts VALID_TRANSITIONS) */
const LEGAL_TRANSITIONS: [OrderStatus, OrderStatus][] = [
  ["LISTED", "OFFER_RECEIVED"],
  ["LISTED", "CANCELLED"],
  ["OFFER_RECEIVED", "OFFER_ACCEPTED"],
  ["OFFER_RECEIVED", "CANCELLED"],
  ["OFFER_ACCEPTED", "TRANSPORT_PENDING"],
  ["OFFER_ACCEPTED", "STORAGE_PENDING"],
  ["OFFER_ACCEPTED", "CANCELLED"],
  ["TRANSPORT_PENDING", "TRANSPORT_BOOKED"],
  ["TRANSPORT_PENDING", "CANCELLED"],
  ["TRANSPORT_BOOKED", "IN_TRANSIT"],
  ["TRANSPORT_BOOKED", "STORAGE_PENDING"],
  ["TRANSPORT_BOOKED", "CANCELLED"],
  ["STORAGE_PENDING", "STORAGE_BOOKED"],
  ["STORAGE_PENDING", "TRANSPORT_PENDING"],
  ["STORAGE_PENDING", "CANCELLED"],
  ["STORAGE_BOOKED", "TRANSPORT_PENDING"],
  ["STORAGE_BOOKED", "IN_TRANSIT"],
  ["STORAGE_BOOKED", "CANCELLED"],
  ["IN_TRANSIT", "DELIVERED"],
  ["IN_TRANSIT", "DISPUTED"],
  ["DELIVERED", "PAYMENT_PENDING"],
  ["DELIVERED", "PAID"],
  ["DELIVERED", "DISPUTED"],
  ["PAYMENT_PENDING", "PAID"],
  ["PAYMENT_PENDING", "DISPUTED"],
  ["PAID", "CLOSED"],
  ["DISPUTED", "CANCELLED"],
  ["DISPUTED", "CLOSED"],
]

/** Terminal states — no outgoing transitions */
const TERMINAL_STATES: OrderStatus[] = ["CLOSED", "CANCELLED"]

describe("orderStateMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("canTransition", () => {
    it.each(LEGAL_TRANSITIONS)("should allow legal transition: %s → %s", (from, to) => {
      expect(canTransition(from, to)).toBe(true)
    })

    it("should reject transition from CLOSED to any state", () => {
      for (const status of ALL_STATUSES) {
        expect(canTransition("CLOSED", status)).toBe(false)
      }
    })

    it("should reject transition from CANCELLED to any state", () => {
      for (const status of ALL_STATUSES) {
        expect(canTransition("CANCELLED", status)).toBe(false)
      }
    })

    it("should reject self-transitions", () => {
      for (const status of ALL_STATUSES) {
        expect(canTransition(status, status)).toBe(false)
      }
    })

    it("should reject LISTED → IN_TRANSIT (skipping intermediate states)", () => {
      expect(canTransition("LISTED", "IN_TRANSIT")).toBe(false)
    })

    it("should reject LISTED → DELIVERED (skipping all intermediate states)", () => {
      expect(canTransition("LISTED", "DELIVERED")).toBe(false)
    })

    it("should reject IN_TRANSIT → LISTED (backward transition)", () => {
      expect(canTransition("IN_TRANSIT", "LISTED")).toBe(false)
    })

    it("should reject PAID → LISTED (backward transition)", () => {
      expect(canTransition("PAID", "LISTED")).toBe(false)
    })

    it("should reject DELIVERED → CLOSED (must go through payment)", () => {
      expect(canTransition("DELIVERED", "CLOSED")).toBe(false)
    })

    it("should reject OFFER_RECEIVED → IN_TRANSIT (skipping acceptance)", () => {
      expect(canTransition("OFFER_RECEIVED", "IN_TRANSIT")).toBe(false)
    })
  })

  describe("getValidTransitions", () => {
    it("should return correct transitions for LISTED", () => {
      const valid = getValidTransitions("LISTED")
      expect(valid).toContain("OFFER_RECEIVED")
      expect(valid).toContain("CANCELLED")
      expect(valid).toHaveLength(2)
    })

    it("should return correct transitions for OFFER_ACCEPTED", () => {
      const valid = getValidTransitions("OFFER_ACCEPTED")
      expect(valid).toContain("TRANSPORT_PENDING")
      expect(valid).toContain("STORAGE_PENDING")
      expect(valid).toContain("CANCELLED")
      expect(valid).toHaveLength(3)
    })

    it("should return empty array for terminal states", () => {
      for (const terminal of TERMINAL_STATES) {
        expect(getValidTransitions(terminal)).toEqual([])
      }
    })

    it("should return correct transitions for IN_TRANSIT", () => {
      const valid = getValidTransitions("IN_TRANSIT")
      expect(valid).toContain("DELIVERED")
      expect(valid).toContain("DISPUTED")
      expect(valid).toHaveLength(2)
    })

    it("should cover all 14 statuses", () => {
      for (const status of ALL_STATUSES) {
        const result = getValidTransitions(status)
        expect(Array.isArray(result)).toBe(true)
      }
    })
  })

  describe("transition (with DB)", () => {
    it("should call updateOrderStatus and addOrderEvent for legal transition", async () => {
      await transition("order-1", "LISTED", "OFFER_RECEIVED", { offerId: "o1" })

      expect(updateOrderStatus).toHaveBeenCalledWith("order-1", { status: "OFFER_RECEIVED" })
      expect(addOrderEvent).toHaveBeenCalledWith(
        "order-1",
        "STATUS_LISTED_TO_OFFER_RECEIVED",
        expect.objectContaining({ from: "LISTED", to: "OFFER_RECEIVED", offerId: "o1" }),
      )
    })

    it("should throw for illegal transition without calling DB", async () => {
      await expect(
        transition("order-1", "LISTED", "IN_TRANSIT"),
      ).rejects.toThrow("Invalid order transition: LISTED -> IN_TRANSIT")

      expect(updateOrderStatus).not.toHaveBeenCalled()
      expect(addOrderEvent).not.toHaveBeenCalled()
    })

    it("should throw for transition from terminal state", async () => {
      await expect(
        transition("order-1", "CLOSED", "LISTED"),
      ).rejects.toThrow("Invalid order transition: CLOSED -> LISTED")
    })

    it("should include payload in event data", async () => {
      await transition("order-2", "OFFER_ACCEPTED", "TRANSPORT_PENDING", {
        transporterId: "t1",
        bookingId: "b1",
      })

      expect(addOrderEvent).toHaveBeenCalledWith(
        "order-2",
        "STATUS_OFFER_ACCEPTED_TO_TRANSPORT_PENDING",
        expect.objectContaining({
          transporterId: "t1",
          bookingId: "b1",
        }),
      )
    })
  })
})
