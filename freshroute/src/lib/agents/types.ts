/**
 * Shared types for the FreshRoute agent architecture.
 *
 * Defines the state graph interface, tool results, and agent errors
 * used across all sub-agents and the coordinator.
 */

import type { OrderStatus } from "@/types"

/** A message in the agent conversation */
export interface AgentMessage {
  role: "user" | "agent" | "system" | "tool"
  content: string
  toolCallId?: string
  toolName?: string
}

/** A lot extracted from user input */
export interface AgentLot {
  crop: string
  quantityKg: number
  location: string
  readyDate: string
  packaging?: string
  storageAvailable?: boolean
  departEarly?: boolean
  grade?: string
  ripeness?: string
  defectRate?: number
  confidence?: number
}

/** A generated scenario (sale option) */
export interface AgentScenario {
  id: string
  title: string
  market: string
  buyerName: string
  gross: number
  net: number
  spoilagePct: number
  risk: string
  recommended: boolean
  score: number
}

/** A tool call made by a sub-agent */
export interface AgentToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  result?: Record<string, unknown>
  requiresApproval: boolean
  approved?: boolean
}

/** Pending approval for a write action */
export interface PendingApproval {
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
  status: "pending" | "approved" | "rejected"
}

/** Error captured during agent execution */
export interface AgentError {
  stage: string
  agentName: string
  message: string
  timestamp: number
  retryable: boolean
}

/** The state that flows through the agent graph */
export interface AgentState {
  /** Conversation messages */
  messages: AgentMessage[]
  /** Current processing stage */
  currentStage: string
  /** Extracted lot details */
  lot?: AgentLot
  /** Generated scenarios */
  scenarios?: AgentScenario[]
  /** Pending user approvals for write actions */
  pendingApprovals: PendingApproval[]
  /** Tool call results */
  toolResults: AgentToolCall[]
  /** Current sub-agent iteration count */
  iterationCount: number
  /** Total steps across all sub-agents */
  totalSteps: number
  /** Total tokens consumed */
  totalTokens: number
  /** Estimated cost in USD */
  estimatedCostUsd: number
  /** Errors encountered */
  errors: AgentError[]
  /** Which sub-agent is currently active */
  activeAgent: string
  /** User ID for persistence */
  userId?: string
  /** Session ID for multi-turn conversations */
  sessionId: string
  /** Language preference */
  lang: string
  /** The final response text to send to the user */
  responseText?: string
}

/** Limits per spec Section 9 */
export const AGENT_LIMITS = {
  MAX_AGENT_STEPS: 6,
  MAX_TOTAL_STEPS: 20,
  MAX_TOKENS_PER_RUN: 50_000,
  TOOL_TIMEOUT_MS: 10_000,
  MAX_RETRIES: 3,
  RETRY_BACKOFF_MS: [0, 1000, 3000],
} as const

/** Cost per 1K tokens for Gemini models */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "gemini-2.5-flash": { input: 0.000075, output: 0.0003 },
  "gemini-flash-latest": { input: 0.000075, output: 0.0003 },
}
