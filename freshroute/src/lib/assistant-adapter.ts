/**
 * assistant-ui ChatModelAdapter that wraps the existing Supabase gemini-proxy.
 *
 * The adapter converts assistant-ui's ThreadMessage[] into the shape
 * expected by the `chat` action of the gemini-proxy Edge Function,
 * and returns the response in the format assistant-ui expects.
 */

import type { ChatModelAdapter, ThreadMessage } from "@assistant-ui/react"
import { agentChat, type ChatContext } from "@/lib/gemini"

/**
 * Convert assistant-ui ThreadMessage[] into the history shape
 * the gemini-proxy chat action expects.
 */
function toProxyHistory(messages: readonly ThreadMessage[]): { role: "user" | "agent"; text: string }[] {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? ("agent" as const) : ("user" as const),
      text: m.content
        .filter((c) => c.type === "text")
        .map((c) => (c as { type: "text"; text: string }).text)
        .join("\n"),
    }))
    .filter((m) => m.text.trim().length > 0)
}

/**
 * Build a ChatContext from the current thread's messages.
 * For now we pass empty summaries - the director can enrich this later
 * with lot/scenario/price data from the app store.
 */
function buildContext(_messages: readonly ThreadMessage[]): ChatContext {
  return {
    lotSummary: "none",
    scenariosSummary: "none",
    pricesSummary: "none",
  }
}

export const geminiChatAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal }) {
    const history = toProxyHistory(messages)
    const ctx = buildContext(messages)

    try {
      const reply = await agentChat(history, ctx)
      return {
        content: [{ type: "text" as const, text: reply }],
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw err
      }
      return {
        content: [
          {
            type: "text" as const,
            text: "Sorry, I couldn't reach the assistant. Please try again.",
          },
        ],
      }
    }
  },
}
