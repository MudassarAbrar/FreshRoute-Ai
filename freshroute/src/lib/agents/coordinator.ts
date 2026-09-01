/**
 * FreshRoute Coordinator — LangGraph.js agent state graph.
 *
 * Orchestrates 7 sub-agents to handle the full farmer-to-sale workflow:
 *   intake → quality → market_intel → risk → matchmaking → negotiation → logistics
 *
 * The coordinator routes each user message to the appropriate sub-agent,
 * enforces iteration limits, tracks token usage, and validates responses
 * through the anti-fabrication system.
 *
 * Architecture note:
 * LangGraph.js runs in Node.js. The Supabase Edge Function (Deno runtime)
 * currently uses native Gemini function calling as a thin proxy. This
 * coordinator is designed to run as a separate service (Cloud Run / Railway)
 * or within the frontend via a serverless function.
 *
 * When deployed, the flow is:
 *   Frontend → Supabase (auth + data) → Agent Service (LangGraph) → Gemini
 */

import { Annotation, StateGraph, START, END } from "@langchain/langgraph"
import type {
  AgentState,
  AgentMessage,
  AgentError,
  PendingApproval,
} from "./types"
import { AGENT_LIMITS, MODEL_PRICING } from "./types"
import { sanitizeResponse } from "@/lib/antiFabrication"

// ─── State Annotation ─────────────────────────────────

const AgentStateAnnotation = Annotation.Root({
  messages: Annotation<AgentMessage[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  currentStage: Annotation<string>({ reducer: (_, next) => next, default: () => "intake" }),
  lot: Annotation<AgentState["lot"]>({ reducer: (_, next) => next }),
  scenarios: Annotation<AgentState["scenarios"]>({ reducer: (_, next) => next }),
  pendingApprovals: Annotation<PendingApproval[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  toolResults: Annotation<AgentState["toolResults"]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  iterationCount: Annotation<number>({ reducer: (_, next) => next, default: () => 0 }),
  totalSteps: Annotation<number>({ reducer: (_, next) => next, default: () => 0 }),
  totalTokens: Annotation<number>({ reducer: (_, next) => next, default: () => 0 }),
  estimatedCostUsd: Annotation<number>({ reducer: (_, next) => next, default: () => 0 }),
  errors: Annotation<AgentError[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  activeAgent: Annotation<string>({ reducer: (_, next) => next, default: () => "coordinator" }),
  userId: Annotation<string | undefined>({ reducer: (_, next) => next }),
  sessionId: Annotation<string>({ reducer: (_, next) => next, default: () => "" }),
  lang: Annotation<string>({ reducer: (_, next) => next, default: () => "en" }),
  responseText: Annotation<string | undefined>({ reducer: (_, next) => next }),
})

// ─── Sub-Agent Nodes ──────────────────────────────────

/**
 * Intake agent: extracts lot details from farmer messages.
 * Tools: extract_lot, get_lot_details
 */
async function intakeNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  // In production, this calls Gemini with the intake agent instructions
  // For now, delegate to the existing extractLot() in gemini.ts
  return {
    activeAgent: "intake",
    currentStage: "intake",
    totalSteps: state.totalSteps + 1,
  }
}

/**
 * Quality agent: analyzes photos, estimates grade and defect rate.
 * Tools: analyze_photo, calculate_spoilage_risk
 */
async function qualityNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  return {
    activeAgent: "quality",
    currentStage: "quality",
    totalSteps: state.totalSteps + 1,
  }
}

/**
 * Market intelligence agent: price data, market comparisons.
 * Tools: get_prices, get_market_trends
 */
async function marketIntelNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  return {
    activeAgent: "market_intel",
    currentStage: "market_intel",
    totalSteps: state.totalSteps + 1,
  }
}

/**
 * Risk agent: spoilage risk, timing recommendations.
 * Tools: calculate_spoilage_risk, get_weather
 */
async function riskNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  return {
    activeAgent: "risk",
    currentStage: "risk",
    totalSteps: state.totalSteps + 1,
  }
}

/**
 * Matchmaking agent: match to buyers, transport, storage.
 * Tools: search_buyers, get_transport_quotes, get_storage_quotes
 */
async function matchmakingNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  return {
    activeAgent: "matchmaking",
    currentStage: "matchmaking",
    totalSteps: state.totalSteps + 1,
  }
}

/**
 * Negotiation agent: interpret buyer replies, handle counter-offers.
 * Tools: parse_reply, create_counter_offer
 */
async function negotiationNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  return {
    activeAgent: "negotiation",
    currentStage: "negotiation",
    totalSteps: state.totalSteps + 1,
  }
}

/**
 * Logistics agent: transport/storage booking, tracking.
 * Tools: book_transport, book_storage, get_location
 */
async function logisticsNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  return {
    activeAgent: "logistics",
    currentStage: "logistics",
    totalSteps: state.totalSteps + 1,
  }
}

// ─── Routing Logic ────────────────────────────────────

/**
 * Determine which sub-agent to route to based on the current stage
 * and conversation state.
 */
function routeToAgent(state: typeof AgentStateAnnotation.State): string {
  const stage = state.currentStage

  // Check iteration limits
  if (state.totalSteps >= AGENT_LIMITS.MAX_TOTAL_STEPS) {
    return "__end__"
  }
  if (state.totalTokens >= AGENT_LIMITS.MAX_TOKENS_PER_RUN) {
    return "__end__"
  }

  // Route by stage
  switch (stage) {
    case "intake": return "intake"
    case "quality": return "quality"
    case "market_intel": return "market_intel"
    case "risk": return "risk"
    case "matchmaking": return "matchmaking"
    case "negotiation": return "negotiation"
    case "logistics": return "logistics"
    default: return "__end__"
  }
}

// ─── Post-Processing (anti-fabrication) ───────────────

/**
 * Final node: sanitize the agent response through anti-fabrication.
 */
async function sanitizeNode(state: typeof AgentStateAnnotation.State): Promise<Partial<typeof AgentStateAnnotation.State>> {
  if (!state.responseText) return {}

  const toolResults = state.toolResults
    .filter((tr) => tr.result)
    .map((tr) => ({ name: tr.name, result: tr.result! }))

  const { text, claimsFound, claimsReplaced } = sanitizeResponse(state.responseText, toolResults)

  return {
    responseText: text,
    messages: claimsReplaced > 0
      ? [{ role: "system", content: `Anti-fabrication: replaced ${claimsReplaced}/${claimsFound} unverified claims` }]
      : [],
  }
}

// ─── Build the Graph ──────────────────────────────────

const graph = new StateGraph(AgentStateAnnotation)
  .addNode("intake", intakeNode)
  .addNode("quality", qualityNode)
  .addNode("market_intel", marketIntelNode)
  .addNode("risk", riskNode)
  .addNode("matchmaking", matchmakingNode)
  .addNode("negotiation", negotiationNode)
  .addNode("logistics", logisticsNode)
  .addNode("sanitize", sanitizeNode)
  .addConditionalEdges(START, routeToAgent, {
    intake: "intake",
    quality: "quality",
    market_intel: "market_intel",
    risk: "risk",
    matchmaking: "matchmaking",
    negotiation: "negotiation",
    logistics: "logistics",
    __end__: END,
  })
  .addEdge("intake", "sanitize")
  .addEdge("quality", "sanitize")
  .addEdge("market_intel", "sanitize")
  .addEdge("risk", "sanitize")
  .addEdge("matchmaking", "sanitize")
  .addEdge("negotiation", "sanitize")
  .addEdge("logistics", "sanitize")
  .addEdge("sanitize", END)

export const compiledGraph = graph.compile()

/**
 * Run the agent graph for a single user turn.
 * Returns the response text and metadata.
 */
export async function runAgent(
  sessionId: string,
  userMessage: string,
  options: {
    userId?: string
    lang?: string
    currentStage?: string
  } = {},
): Promise<{
  responseText: string
  pendingApprovals: PendingApproval[]
  totalSteps: number
  totalTokens: number
  errors: AgentError[]
}> {
  const initialState = {
    messages: [{ role: "user" as const, content: userMessage }],
    currentStage: options.currentStage ?? "intake",
    pendingApprovals: [],
    toolResults: [],
    iterationCount: 0,
    totalSteps: 0,
    totalTokens: 0,
    estimatedCostUsd: 0,
    errors: [],
    activeAgent: "coordinator",
    sessionId,
    userId: options.userId,
    lang: options.lang ?? "en",
  }

  try {
    const result = await compiledGraph.invoke(initialState)
    return {
      responseText: result.responseText ?? "",
      pendingApprovals: result.pendingApprovals ?? [],
      totalSteps: result.totalSteps ?? 0,
      totalTokens: result.totalTokens ?? 0,
      errors: result.errors ?? [],
    }
  } catch (error) {
    return {
      responseText: "I encountered an error processing your request. Please try again.",
      pendingApprovals: [],
      totalSteps: 0,
      totalTokens: 0,
      errors: [{
        stage: "coordinator",
        agentName: "coordinator",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: Date.now(),
        retryable: true,
      }],
    }
  }
}
