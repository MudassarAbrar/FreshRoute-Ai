/**
 * Risk Classifier (Task 8) - Read-only auto-execute, write requires approval.
 */
import { TOOL_REGISTRY, type ToolName } from "./tools"
import type { PlanStep } from "./planner"

export interface ClassifiedStep {
  step: PlanStep
  classification: "auto_execute" | "requires_approval"
}

export function classifySteps(steps: PlanStep[]): ClassifiedStep[] {
  return steps.map((step) => {
    const tool = TOOL_REGISTRY[step.toolName]
    return {
      step,
      classification: tool?.classification === "write" ? "requires_approval" : "auto_execute",
    }
  })
}

export function getWriteToolNames(): ToolName[] {
  return (Object.values(TOOL_REGISTRY) as typeof TOOL_REGISTRY[ToolName][])
    .filter((t) => t.classification === "write")
    .map((t) => t.name)
}
