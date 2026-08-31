/**
 * Order State Machine + Audit Trail (Task 9)
 *
 * Formal state machine for orders with every transition logged to order_events.
 */
import type { OrderStatus } from "@/types"
import { updateOrderStatus, addOrderEvent } from "@/lib/db"

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

export async function transition(
  orderId: string,
  from: OrderStatus,
  to: OrderStatus,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid order transition: ${from} -> ${to}`)
  }

  // Update order status in DB
  await updateOrderStatus(orderId, { status: to })

  // Log the event to order_events (audit trail)
  await addOrderEvent(orderId, `STATUS_${from}_TO_${to}`, {
    from,
    to,
    ...payload,
    timestamp: new Date().toISOString(),
  })
}
