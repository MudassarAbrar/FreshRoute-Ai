/**
 * Monitor (Task 8) - Background checks for stuck orders and threshold breaches.
 * MVP: runs client-side via setTimeout in the director.
 */
import type { Lot } from "@/types"
import { calculateSpoilage } from "@/lib/spoilage"

export interface MonitorCheck {
  type: "spoilage_threshold" | "order_stuck" | "provider_timeout"
  triggered: boolean
  detail: string
  recommendedAction?: string
}

export function checkSpoilageThreshold(lot: Lot, thresholdPct: number = 0.15): MonitorCheck {
  const result = calculateSpoilage({
    commodity: lot.crop,
    harvestDate: lot.readyDate,
    expectedWaitHours: 24,
    transportMode: "ambient",
    handlingEvents: 1,
  })

  return {
    type: "spoilage_threshold",
    triggered: result.expectedLossPct > thresholdPct,
    detail: `Spoilage risk at ${(result.expectedLossPct * 100).toFixed(1)}% (threshold: ${(thresholdPct * 100).toFixed(0)}%)`,
    recommendedAction: result.expectedLossPct > thresholdPct
      ? "Expedite sale or switch to refrigerated transport"
      : undefined,
  }
}

export function checkOrderStuck(
  currentStatus: string,
  lastUpdatedMs: number,
  maxStaleMs: number = 4 * 60 * 60 * 1000,
): MonitorCheck {
  const terminalStates = ["DELIVERED", "PAID", "CLOSED", "CANCELLED"]
  if (terminalStates.includes(currentStatus)) {
    return { type: "order_stuck", triggered: false, detail: "Order in terminal state" }
  }

  const staleMs = Date.now() - lastUpdatedMs
  return {
    type: "order_stuck",
    triggered: staleMs > maxStaleMs,
    detail: `Order ${currentStatus} for ${Math.round(staleMs / 3600000)} hours`,
    recommendedAction: staleMs > maxStaleMs ? "Re-trigger planner for next step" : undefined,
  }
}

export function checkProviderTimeout(
  providerResponded: boolean,
  waitHours: number,
  maxWaitHours: number = 4,
): MonitorCheck {
  return {
    type: "provider_timeout",
    triggered: !providerResponded && waitHours > maxWaitHours,
    detail: `Provider ${providerResponded ? "responded" : "no response"} after ${waitHours}h`,
    recommendedAction: !providerResponded && waitHours > maxWaitHours
      ? "Search for alternative provider"
      : undefined,
  }
}
