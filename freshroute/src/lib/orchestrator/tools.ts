/**
 * Agentic Workflow Orchestrator - Tool Definitions (Task 8)
 *
 * 12 tools classified as read_only or write.
 * Write tools require approval and idempotency keys.
 */
import { buildScenarios } from "@/lib/engine"
import { calculateSpoilage } from "@/lib/spoilage"
import { matchLotToBuyers } from "@/lib/matching"
import { rankTransporters, rankStorageProviders } from "@/lib/providerMatching"
import {
  fetchListingById,
  fetchListings,
  createOffer,
  createTransportBooking,
  createStorageBooking,
  updateOrderStatus,
  addOrderEvent,
} from "@/lib/db"
import type { Lot } from "@/types"

export type ToolName =
  | "get_lot_details" | "calculate_spoilage_risk" | "get_recommendation"
  | "search_buyers" | "get_transport_quotes" | "get_storage_quotes"
  | "draft_offer_message" | "send_offer_message"
  | "book_transport" | "book_storage"
  | "schedule_reminder" | "update_order_status"

export type ToolClassification = "read_only" | "write"

export interface ToolDefinition {
  name: ToolName
  classification: ToolClassification
  description: string
  execute: (params: Record<string, unknown>) => Promise<unknown>
}

export const ALLOWED_DOMAINS = [
  "spoilage", "recommendations", "matching", "booking",
  "tracking", "reminders", "orders", "listings",
]

export const TOOL_REGISTRY: Record<ToolName, ToolDefinition> = {
  get_lot_details: {
    name: "get_lot_details",
    classification: "read_only",
    description: "Retrieve lot details by listing ID",
    execute: async (params) => fetchListingById(params.listingId as string),
  },

  calculate_spoilage_risk: {
    name: "calculate_spoilage_risk",
    classification: "read_only",
    description: "Calculate spoilage risk for a commodity",
    execute: async (params) => calculateSpoilage({
      commodity: params.commodity as string,
      harvestDate: params.harvestDate as string,
      expectedWaitHours: params.hours as number,
      transportMode: (params.transportMode as "refrigerated" | "ambient" | "none") ?? "ambient",
      handlingEvents: (params.handlingEvents as number) ?? 1,
    }),
  },

  get_recommendation: {
    name: "get_recommendation",
    classification: "read_only",
    description: "Generate sale scenario recommendations for a lot",
    execute: async (params) => buildScenarios(params.lot as Lot),
  },

  search_buyers: {
    name: "search_buyers",
    classification: "read_only",
    description: "Search for matching buyer requests",
    execute: async (params) => {
      const brs = await fetchListings({ listingType: "buyer_request", commodity: params.commodity as string })
      return matchLotToBuyers({ lotListingId: params.listingId as string, lot: params.lot as Lot }, brs)
    },
  },

  get_transport_quotes: {
    name: "get_transport_quotes",
    classification: "read_only",
    description: "Get transport quotes for a route",
    execute: async (params) => rankTransporters({ lot: params.lot as Lot, destCity: params.destCity as string, pickupWindow: params.pickupWindow as string }),
  },

  get_storage_quotes: {
    name: "get_storage_quotes",
    classification: "read_only",
    description: "Get storage quotes for a lot",
    execute: async (params) => rankStorageProviders({ lot: params.lot as Lot, neededDays: params.neededDays as number }),
  },

  draft_offer_message: {
    name: "draft_offer_message",
    classification: "read_only",
    description: "Draft an offer message to a buyer",
    execute: async (params) => ({
      draft: `Assalam-o-Alaikum! I have ${params.quantity} kg Grade ${params.grade} ${params.commodity} in ${params.location}. Asking PKR ${params.price}/kg. Can you take the full lot?`,
      recipient: params.buyerName,
    }),
  },

  send_offer_message: {
    name: "send_offer_message",
    classification: "write",
    description: "Send an offer to a buyer (requires approval)",
    execute: async (params) => createOffer({
      listingId: params.listingId as string,
      offeringUserId: params.userId as string,
      price: params.price as number,
      quantity: params.quantity as number,
      message: params.message as string,
    }),
  },

  book_transport: {
    name: "book_transport",
    classification: "write",
    description: "Book a transporter (requires approval)",
    execute: async (params) => createTransportBooking({
      orderId: params.orderId as string,
      transporterUserId: params.transporterUserId as string,
      pickupWindow: params.pickupWindow as string,
      dropoffWindow: params.dropoffWindow as string,
      rate: params.rate as number,
    }),
  },

  book_storage: {
    name: "book_storage",
    classification: "write",
    description: "Book a storage facility (requires approval)",
    execute: async (params) => createStorageBooking({
      orderOrLotId: params.orderOrLotId as string,
      storageUserId: params.storageUserId as string,
      startDate: params.startDate as string,
      endDate: params.endDate as string,
      rate: params.rate as number,
    }),
  },

  schedule_reminder: {
    name: "schedule_reminder",
    classification: "write",
    description: "Schedule a reminder for a future action",
    execute: async (params) => ({ scheduled: true, at: params.at, message: params.message }),
  },

  update_order_status: {
    name: "update_order_status",
    classification: "write",
    description: "Update order status (requires approval for financial changes)",
    execute: async (params) => {
      const orderId = params.orderId as string
      await updateOrderStatus(orderId, { status: params.status as string })
      await addOrderEvent(orderId, "STATUS_CHANGED", { newStatus: params.status, previousStatus: params.previousStatus })
      return { updated: true, orderId, newStatus: params.status }
    },
  },
}
