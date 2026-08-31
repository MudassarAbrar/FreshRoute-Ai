/**
 * Executor (Task 8) - Iterates plan steps, calls tools, logs to agent_action_log.
 * Handles idempotency via idempotency keys.
 */
import { TOOL_REGISTRY, type ToolName } from "./tools"
import { saveAgentAction, checkIdempotency } from "@/lib/db"
import type { ClassifiedStep } from "./riskClassifier"

export interface ExecutionResult {
  toolName: ToolName
  success: boolean
  result?: unknown
  error?: string
  skipped?: boolean
}

export async function executeApprovedSteps(
  agentRunId: string,
  steps: ClassifiedStep[],
  approvedToolNames: Set<ToolName>,
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = []

  for (let i = 0; i < steps.length; i++) {
    const { step, classification } = steps[i]
    const idempotencyKey = `${agentRunId}-${i}-${step.toolName}`

    // Write steps need explicit approval
    if (classification === "requires_approval" && !approvedToolNames.has(step.toolName)) {
      results.push({ toolName: step.toolName, success: false, skipped: true, error: "Awaiting approval" })
      continue
    }

    // Idempotency check
    try {
      const alreadyExecuted = await checkIdempotency(idempotencyKey)
      if (alreadyExecuted) {
        results.push({ toolName: step.toolName, success: true, skipped: true, result: "Already executed" })
        continue
      }
    } catch {
      // Continue if idempotency check fails
    }

    // Execute the tool
    const tool = TOOL_REGISTRY[step.toolName]
    if (!tool) {
      results.push({ toolName: step.toolName, success: false, error: "Tool not found" })
      continue
    }

    try {
      const result = await tool.execute(step.params)
      // Log to agent_action_log
      await saveAgentAction({
        agentRunId: idempotencyKey,
        actionType: step.toolName,
        input: step.params,
        output: { result: String(result) },
        requiresApproval: classification === "requires_approval",
        status: "executed",
      })
      results.push({ toolName: step.toolName, success: true, result })
    } catch (err: any) {
      await saveAgentAction({
        agentRunId: idempotencyKey,
        actionType: step.toolName,
        input: step.params,
        output: { error: err.message },
        requiresApproval: classification === "requires_approval",
        status: "failed",
      }).catch(() => {})
      results.push({ toolName: step.toolName, success: false, error: err.message })
    }
  }

  return results
}
