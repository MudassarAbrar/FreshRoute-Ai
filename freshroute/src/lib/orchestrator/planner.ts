/**
 * Planner (Task 8) - Rule-based stage-to-tool mapping.
 * Future: swap to LLM-based planner via Gemini function calling.
 */
import type { ToolName } from "./tools"
import { ALLOWED_DOMAINS } from "./tools"

export interface PlanStep {
  toolName: ToolName
  params: Record<string, unknown>
  description: string
}

export interface Plan {
  steps: PlanStep[]
  context: Record<string, unknown>
}

export function isDomainAllowed(request: string): boolean {
  const lower = request.toLowerCase()
  return ALLOWED_DOMAINS.some((d) => lower.includes(d)) ||
    /sell|buy|transport|store|price|spoilage|order|track|remind/i.test(request)
}

export function createPlan(stage: string, context: Record<string, unknown>): Plan {
  const steps: PlanStep[] = []

  switch (stage) {
    case "intake":
      steps.push(
        { toolName: "get_lot_details", params: context, description: "Retrieve lot details" },
        { toolName: "calculate_spoilage_risk", params: context, description: "Assess spoilage risk" },
      )
      break
    case "options":
      steps.push(
        { toolName: "get_recommendation", params: context, description: "Generate recommendations" },
        { toolName: "search_buyers", params: context, description: "Search matching buyers" },
        { toolName: "get_transport_quotes", params: context, description: "Get transport quotes" },
        { toolName: "get_storage_quotes", params: context, description: "Get storage quotes" },
      )
      break
    case "outreach-approval":
      steps.push({ toolName: "draft_offer_message", params: context, description: "Draft outreach" })
      break
    case "outreach":
      steps.push({ toolName: "send_offer_message", params: context, description: "Send offer" })
      break
    case "booking":
      steps.push(
        { toolName: "book_transport", params: context, description: "Book transport" },
        { toolName: "update_order_status", params: { ...context, status: "TRANSPORT_BOOKED" }, description: "Update status" },
      )
      break
    case "tracking":
      steps.push(
        { toolName: "update_order_status", params: context, description: "Update tracking" },
        { toolName: "schedule_reminder", params: context, description: "Schedule check-in" },
      )
      break
    default:
      steps.push(
        { toolName: "get_lot_details", params: context, description: "Retrieve context" },
        { toolName: "get_recommendation", params: context, description: "Generate recommendations" },
      )
  }

  return { steps, context }
}
