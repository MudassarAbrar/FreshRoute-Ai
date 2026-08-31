/**
 * ADK Agent Definition — tool schemas, agent config, and instruction (Phase 3).
 *
 * This module is the single source of truth for the FreshRoute agent's tool
 * definitions and system instruction.  Both the Edge Function (which constructs
 * real ADK FunctionTool / LlmAgent instances) and the client (which needs tool
 * names and risk metadata for approval UI) import from here.
 */
import { ALLOWED_DOMAINS } from "./tools"

// ── Agent instruction ────────────────────────────────────────────────
export const AGENT_INSTRUCTION = `You are FreshRoute Agent, an AI selling assistant for Pakistani farmers and produce traders.

## Role
Help sellers get the best price for their produce by:
1. Extracting lot details (crop, quantity, location, grade, packaging)
2. Analyzing spoilage risk and recommending timing
3. Matching to real buyers, transporters, and storage providers
4. Drafting and sending offers (with user approval for write actions)
5. Booking transport and storage (with user approval)
6. Tracking orders through completion

## Domain boundary
You ONLY help with: ${ALLOWED_DOMAINS.join(", ")}.
If the user asks about anything outside these topics, politely deflect:
"I can help with selling produce, finding buyers, transport, storage, pricing and spoilage. Can you tell me more about your produce?"

## Language
- Default to Urdu (roman or script) when the user writes in Urdu
- Default to English when the user writes in English
- Always be respectful and use culturally appropriate greetings

## Write actions
Before executing send_offer_message, book_transport, book_storage, or update_order_status,
you MUST present the action details and wait for explicit user approval.`

// ── Tool parameter schemas (Zod-compatible JSON Schema format) ──────
// These are plain objects so they can be serialized to the Edge Function.

export interface ToolSchema {
  name: string
  description: string
  classification: "read_only" | "write"
  parameters: Record<string, { type: string; description: string; required?: boolean }>
}

export const TOOL_SCHEMAS: ToolSchema[] = [
  // ── Read tools (auto-execute) ──────────────────────────────
  {
    name: "get_lot_details",
    description: "Retrieve lot details by listing ID",
    classification: "read_only",
    parameters: {
      listingId: { type: "string", description: "The listing ID to fetch", required: true },
    },
  },
  {
    name: "calculate_spoilage_risk",
    description: "Calculate spoilage risk for a commodity lot",
    classification: "read_only",
    parameters: {
      commodity: { type: "string", description: "Crop name (e.g. Tomato)", required: true },
      harvestDate: { type: "string", description: "Harvest / ready date", required: true },
      hours: { type: "number", description: "Expected wait hours", required: true },
      transportMode: { type: "string", description: "refrigerated | ambient | none" },
      handlingEvents: { type: "number", description: "Number of handling events" },
    },
  },
  {
    name: "get_recommendation",
    description: "Generate sale scenario recommendations for a lot",
    classification: "read_only",
    parameters: {
      crop: { type: "string", description: "Crop name", required: true },
      quantityKg: { type: "number", description: "Lot weight in kg", required: true },
      location: { type: "string", description: "Origin city", required: true },
      grade: { type: "string", description: "Grade (A/B/C)" },
    },
  },
  {
    name: "search_buyers",
    description: "Search for matching buyer requests for a commodity lot",
    classification: "read_only",
    parameters: {
      commodity: { type: "string", description: "Crop name to match", required: true },
      listingId: { type: "string", description: "Seller's listing ID" },
    },
  },
  {
    name: "get_transport_quotes",
    description: "Get ranked transport quotes for a route",
    classification: "read_only",
    parameters: {
      originCity: { type: "string", description: "Pickup city", required: true },
      destCity: { type: "string", description: "Destination city", required: true },
      crop: { type: "string", description: "Crop (affects refrigeration need)" },
      quantityKg: { type: "number", description: "Lot weight" },
    },
  },
  {
    name: "get_storage_quotes",
    description: "Get ranked storage provider quotes",
    classification: "read_only",
    parameters: {
      city: { type: "string", description: "City where storage is needed", required: true },
      neededDays: { type: "number", description: "Number of storage days", required: true },
    },
  },
  {
    name: "draft_offer_message",
    description: "Draft an offer message to send to a buyer",
    classification: "read_only",
    parameters: {
      buyerName: { type: "string", description: "Buyer organization name", required: true },
      commodity: { type: "string", description: "Crop name", required: true },
      quantity: { type: "number", description: "Quantity in kg", required: true },
      grade: { type: "string", description: "Produce grade", required: true },
      price: { type: "number", description: "Asking price per kg in PKR", required: true },
      location: { type: "string", description: "Seller location", required: true },
    },
  },
  // ── Write tools (require approval) ─────────────────────────
  {
    name: "send_offer_message",
    description: "Send an offer to a buyer (requires user approval before executing)",
    classification: "write",
    parameters: {
      listingId: { type: "string", description: "Listing ID for the offer", required: true },
      userId: { type: "string", description: "Seller user ID", required: true },
      price: { type: "number", description: "Offer price per kg", required: true },
      quantity: { type: "number", description: "Offer quantity in kg", required: true },
      message: { type: "string", description: "Offer message text", required: true },
    },
  },
  {
    name: "book_transport",
    description: "Book a transporter for an order (requires user approval)",
    classification: "write",
    parameters: {
      orderId: { type: "string", description: "Order ID", required: true },
      transporterUserId: { type: "string", description: "Transporter user ID", required: true },
      pickupWindow: { type: "string", description: "Pickup time window", required: true },
      dropoffWindow: { type: "string", description: "Dropoff time window", required: true },
      rate: { type: "number", description: "Agreed rate in PKR", required: true },
    },
  },
  {
    name: "book_storage",
    description: "Book a storage facility (requires user approval)",
    classification: "write",
    parameters: {
      orderOrLotId: { type: "string", description: "Order or lot ID", required: true },
      storageUserId: { type: "string", description: "Storage provider user ID", required: true },
      startDate: { type: "string", description: "Storage start date", required: true },
      endDate: { type: "string", description: "Storage end date", required: true },
      rate: { type: "number", description: "Rate per kg per day", required: true },
    },
  },
  {
    name: "schedule_reminder",
    description: "Schedule a reminder for a future action",
    classification: "write",
    parameters: {
      at: { type: "string", description: "ISO datetime for the reminder", required: true },
      message: { type: "string", description: "Reminder message", required: true },
    },
  },
  {
    name: "update_order_status",
    description: "Update order status (requires approval for financial changes)",
    classification: "write",
    parameters: {
      orderId: { type: "string", description: "Order ID", required: true },
      status: { type: "string", description: "New status", required: true },
      previousStatus: { type: "string", description: "Previous status for audit" },
    },
  },
]

/** Write tool names — these require user approval before execution */
export const WRITE_TOOL_NAMES = TOOL_SCHEMAS
  .filter((t) => t.classification === "write")
  .map((t) => t.name)

/** Agent configuration passed to the Edge Function */
export const AGENT_CONFIG = {
  name: "freshroute_agent",
  model: "gemini-2.5-flash",
  instruction: AGENT_INSTRUCTION,
  toolNames: TOOL_SCHEMAS.map((t) => t.name),
}
