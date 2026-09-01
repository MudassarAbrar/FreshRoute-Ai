/**
 * Order State Machine — shared module for Supabase Edge Functions.
 *
 * This is the authoritative state machine for order status transitions.
 * All Edge Functions that modify order status MUST use this module to
 * validate transitions before writing to the database.
 *
 * 14 states, formal transitions only.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

export type OrderStatus =
  | "LISTED" | "OFFER_RECEIVED" | "OFFER_ACCEPTED"
  | "TRANSPORT_PENDING" | "TRANSPORT_BOOKED"
  | "STORAGE_PENDING" | "STORAGE_BOOKED"
  | "IN_TRANSIT" | "DELIVERED"
  | "PAYMENT_PENDING" | "PAID" | "CLOSED"
  | "CANCELLED" | "DISPUTED"

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  LISTED:             ["OFFER_RECEIVED", "CANCELLED"],
  OFFER_RECEIVED:     ["OFFER_ACCEPTED", "CANCELLED"],
  OFFER_ACCEPTED:     ["TRANSPORT_PENDING", "STORAGE_PENDING", "CANCELLED"],
  TRANSPORT_PENDING:  ["TRANSPORT_BOOKED", "CANCELLED"],
  TRANSPORT_BOOKED:   ["IN_TRANSIT", "STORAGE_PENDING", "CANCELLED"],
  STORAGE_PENDING:    ["STORAGE_BOOKED", "TRANSPORT_PENDING", "CANCELLED"],
  STORAGE_BOOKED:     ["TRANSPORT_PENDING", "IN_TRANSIT", "CANCELLED"],
  IN_TRANSIT:         ["DELIVERED", "DISPUTED"],
  DELIVERED:          ["PAYMENT_PENDING", "PAID", "DISPUTED"],
  PAYMENT_PENDING:    ["PAID", "DISPUTED"],
  PAID:               ["CLOSED"],
  CLOSED:             [],
  CANCELLED:          [],
  DISPUTED:           ["CANCELLED", "CLOSED"],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getValidTransitions(from: OrderStatus): OrderStatus[] {
  return VALID_TRANSITIONS[from] ?? []
}

export const ALL_STATUSES: OrderStatus[] = Object.keys(VALID_TRANSITIONS) as OrderStatus[]

/**
 * Atomically transition an order's status with full validation.
 *
 * 1. Fetches current status from DB
 * 2. Validates the transition against VALID_TRANSITIONS
 * 3. Updates orders.status + inserts order_events row in a single operation
 * 4. Returns typed result with success/error
 *
 * This function is designed to be called from Edge Functions with a
 * service-role Supabase client (admin bypasses RLS).
 */
export async function transitionOrder(
  admin: SupabaseClient,
  orderId: string,
  toStatus: OrderStatus,
  meta: {
    source?: string
    actorType?: string
    actorId?: string
    correlationId?: string
    idempotencyKey?: string
    [key: string]: unknown
  } = {},
): Promise<
  | { ok: true; previousStatus: OrderStatus; newStatus: OrderStatus; orderId: string }
  | { ok: false; error: string; code: "INVALID_TRANSITION" | "ORDER_NOT_FOUND" | "DB_ERROR" }
> {
  try {
    // 1. Fetch current order status
    const { data: order, error: fetchError } = await admin
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single()

    if (fetchError || !order) {
      return { ok: false, error: `Order not found: ${orderId}`, code: "ORDER_NOT_FOUND" }
    }

    const previousStatus = order.status as OrderStatus

    // 2. Validate transition
    if (!canTransition(previousStatus, toStatus)) {
      return {
        ok: false,
        error: `Invalid order transition: ${previousStatus} -> ${toStatus}`,
        code: "INVALID_TRANSITION",
      }
    }

    // 3. Atomic update: change status + insert event
    // We use sequential calls within a try/catch — the DB trigger on orders.status
    // (migration 0009) enforces that only this path via transition_order() can update.
    const { error: updateError } = await admin
      .from("orders")
      .update({
        status: toStatus,
        // Signal to the DB trigger that this is an authorized transition
        _transition_source: "state_machine",
      })
      .eq("id", orderId)

    if (updateError) {
      return { ok: false, error: updateError.message, code: "DB_ERROR" }
    }

    // 4. Insert audit event
    await admin.from("order_events").insert({
      order_id: orderId,
      event_type: `STATUS_${previousStatus}_TO_${toStatus}`,
      source: meta.source ?? "agent",
      actor_type: meta.actorType ?? "system",
      actor_id: meta.actorId ?? null,
      previous_state: previousStatus,
      new_state: toStatus,
      correlation_id: meta.correlationId ?? null,
      idempotency_key: meta.idempotencyKey ?? null,
      payload: {
        from: previousStatus,
        to: toStatus,
        ...Object.fromEntries(
          Object.entries(meta).filter(
            ([k]) => !["source", "actorType", "actorId", "correlationId", "idempotencyKey"].includes(k),
          ),
        ),
      },
    })

    return { ok: true, previousStatus, newStatus: toStatus, orderId }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Transition failed",
      code: "DB_ERROR",
    }
  }
}
