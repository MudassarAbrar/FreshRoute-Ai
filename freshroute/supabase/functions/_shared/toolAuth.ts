/**
 * Tool Authorization — spec Section 35.
 *
 * Restricts tool execution by:
 * 1. User role — only transporters can call update_location, etc.
 * 2. Order state — book_transport only valid in TRANSPORT_PENDING, etc.
 *
 * Enforced in Edge Function before tool execution.
 */

import type { OrderStatus } from "./orderStateMachine.ts"

/** Role required for each tool (null = any authenticated user) */
const TOOL_ROLE_REQUIREMENTS: Record<string, string | null> = {
  // Read tools — any authenticated user
  get_lot_details: null,
  calculate_spoilage_risk: null,
  search_buyers: null,
  get_transport_quotes: null,
  get_storage_quotes: null,
  draft_offer_message: null,
  schedule_reminder: null,
  get_prices: null,
  get_market_trends: null,
  get_weather: null,
  get_location: null,
  calculate_route: null,

  // Write tools — role-restricted
  send_offer_message: null, // any seller
  book_transport: "transporter", // only transporters or order owner
  book_storage: "storage_provider", // only storage providers or order owner
  update_order_status: null, // any user with order context
  update_location: "transporter", // only transporters

  // Agent-only tools
  extract_lot: null,
  analyze_photo: null,
  parse_reply: null,
  create_counter_offer: null,
}

/** Valid order states for each write tool */
const TOOL_STATE_REQUIREMENTS: Record<string, OrderStatus[]> = {
  send_offer_message: ["LISTED"],
  book_transport: ["OFFER_ACCEPTED", "TRANSPORT_PENDING"],
  book_storage: ["OFFER_ACCEPTED", "STORAGE_PENDING"],
  update_order_status: [
    "LISTED", "OFFER_RECEIVED", "OFFER_ACCEPTED",
    "TRANSPORT_PENDING", "TRANSPORT_BOOKED", "STORAGE_PENDING", "STORAGE_BOOKED",
    "IN_TRANSIT", "DELIVERED", "PAYMENT_PENDING", "DISPUTED",
  ],
  update_location: ["TRANSPORT_BOOKED", "IN_TRANSIT"],
}

export interface ToolAuthResult {
  allowed: boolean
  reason?: string
  requiredRole?: string
  requiredStates?: string[]
}

/**
 * Check if a tool call is authorized based on user role and order state.
 *
 * @param toolName The tool being called
 * @param userRole The user's role (from user_roles table)
 * @param orderStatus The current order status (if applicable)
 * @param isOrderOwner Whether the user owns the order
 */
export function authorizeToolCall(
  toolName: string,
  userRole: string | null,
  orderStatus?: OrderStatus,
  isOrderOwner?: boolean,
): ToolAuthResult {
  // Check role requirement
  const requiredRole = TOOL_ROLE_REQUIREMENTS[toolName]
  if (requiredRole !== null && requiredRole !== undefined) {
    // Tool requires a specific role
    if (userRole !== requiredRole && !isOrderOwner) {
      return {
        allowed: false,
        reason: `Tool "${toolName}" requires role "${requiredRole}". Current role: "${userRole ?? "none"}".`,
        requiredRole,
      }
    }
  }

  // Check order state requirement (only for write tools)
  const requiredStates = TOOL_STATE_REQUIREMENTS[toolName]
  if (requiredStates && orderStatus) {
    if (!requiredStates.includes(orderStatus)) {
      return {
        allowed: false,
        reason: `Tool "${toolName}" cannot execute in order state "${orderStatus}". Valid states: ${requiredStates.join(", ")}.`,
        requiredStates,
      }
    }
  }

  return { allowed: true }
}

/**
 * Get all tools available for a given role.
 */
export function getAvailableTools(userRole: string | null): string[] {
  return Object.entries(TOOL_ROLE_REQUIREMENTS)
    .filter(([_, requiredRole]) => {
      if (requiredRole === null) return true
      return userRole === requiredRole
    })
    .map(([name]) => name)
}

/**
 * Validate that a write tool is being called in a valid order state.
 * Returns the list of valid states for the tool, or null if no state restriction.
 */
export function getValidStatesForTool(toolName: string): OrderStatus[] | null {
  return TOOL_STATE_REQUIREMENTS[toolName] ?? null
}
