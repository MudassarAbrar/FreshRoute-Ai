import { CROP_ALIASES } from "@/data/market"
import { supabase } from "@/lib/supabase"
import { logAiUsageToFirestore } from "@/lib/firestore"
import { withCircuitBreaker } from "@/lib/circuitBreaker"
import type { Grade, VisionResult } from "@/types"
import type { Lang } from "@/i18n"

/**
 * All Gemini traffic goes through the `gemini-proxy` Supabase Edge Function.
 * The API key lives ONLY in server secrets — never in this bundle or the browser.
 */

export type AiMode = "checking" | "live" | "demo" | "error"

export interface AiStatus {
  mode: AiMode
  model?: string
  error?: string
}

/** The last AI failure, surfaced once by the chat director instead of silently swallowed. */
let lastAiError: string | null = null
export function consumeAiError(): string | null {
  const e = lastAiError
  lastAiError = null
  return e
}

type ProxyData = { ok?: boolean; error?: string; [k: string]: unknown }

/**
 * Sanitize user-generated text before passing to LLM (Task 10 guardrail).
 * Strips instruction-like patterns from listing descriptions and chat messages.
 */
export function sanitizeForLLM(text: string): string {
  if (!text) return text
  // Strip prompt injection patterns
  const sanitized = text
    .replace(/ignore\s+(previous|all|above)\s+(instructions|prompts|rules)/gi, "")
    .replace(/you\s+are\s+now\s+/gi, "")
    .replace(/system\s*:/gi, "")
    .replace(/<\/?script>/gi, "")
    .replace(/<\/?style>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<\/?iframe/gi, "")
    .trim()
  return sanitized || "[sanitized]"
}

async function callProxy(body: Record<string, unknown>): Promise<ProxyData> {
  const action = String(body.action ?? "unknown")

  // Determine fallback for this action
  const fallbackForAction = (): ProxyData => {
    if (action === "extract") {
      const text = String(body.text ?? "")
      const fb = extractLotFallback(text)
      return { ok: true, text: JSON.stringify(fb), model: "fallback" }
    }
    if (action === "vision") {
      return { ok: true, text: JSON.stringify(VISION_FALLBACK), model: "fallback" }
    }
    if (action === "chat") {
      const history = (body.history ?? []) as { role: "user" | "agent"; text: string }[]
      const lang = (body.lang as Lang) ?? "en"
      return { ok: true, text: chatFallback(history, lang), model: "fallback" }
    }
    return { ok: false, error: "Circuit open — fallback unavailable for this action" }
  }

  const protectedCall = withCircuitBreaker<ProxyData>(
    "gemini-proxy",
    async () => {
      const started = Date.now()
      const { data, error } = await supabase.functions.invoke("smart-action", { body })
      const latencyMs = Date.now() - started

      // Log to Firestore (non-blocking, fire-and-forget)
      const proxyData = (data ?? { ok: false, error: "Empty response from AI proxy" }) as ProxyData
      const status: "ok" | "error" = error || !proxyData.ok ? "error" : "ok"
      void logAiUsageToFirestore({
        action,
        model: (proxyData.model as string) ?? "gemini-flash-latest",
        status,
        error: status === "error" ? (error?.message ?? proxyData.error ?? "unknown") : undefined,
        latencyMs,
      })

      if (error) {
        throw new Error(`Could not reach the AI proxy — ${error.message || "network error"}`)
      }
      return proxyData
    },
    () => fallbackForAction(),
  )

  return protectedCall()
}

export async function checkAiStatus(): Promise<AiStatus> {
  const d = await callProxy({ action: "status" })
  if (!d.ok) return { mode: "error", error: d.error ?? "AI proxy unreachable" }
  if (!d.configured) return { mode: "demo" }
  if (!d.valid) return { mode: "error", error: d.error ?? "Server Gemini key rejected" }
  return { mode: "live", model: (d.model as string) ?? "gemini-flash-latest" }
}

export interface LotExtraction {
  crop: string
  quantityKg: number
  location: string
  readyText: string
  confidence: { crop: number; quantity: number; location: number }
  source: "gemini" | "fallback"
}

const CITIES = ["Multan", "Lahore", "Faisalabad", "Islamabad", "Karachi", "Rawalpindi"]

/** Deterministic offline extraction — labeled "fallback" so demo mode is never disguised as AI */
export function extractLotFallback(text: string): LotExtraction {
  const lower = text.toLowerCase()
  let crop = "Tomato"
  for (const [alias, canonical] of Object.entries(CROP_ALIASES)) {
    if (lower.includes(alias)) {
      crop = canonical
      break
    }
  }
  let kg = 800
  const kgMatch = lower.match(/(\d[\d,]*)\s*(kg|kilo|kgs)/)
  const maundMatch = lower.match(/(\d[\d,]*)\s*(maund|man|من)/)
  if (kgMatch) kg = parseInt(kgMatch[1].replace(/,/g, ""), 10)
  else if (maundMatch) kg = Math.round(parseInt(maundMatch[1], 10) * 37.32)
  else {
    const num = lower.match(/(\d[\d,]{2,})/)
    if (num) kg = parseInt(num[1].replace(/,/g, ""), 10)
  }
  let location = "Multan"
  for (const c of CITIES) if (lower.includes(c.toLowerCase())) location = c
  const readyText = /tomorrow|کل|kal/.test(lower)
    ? "tomorrow"
    : /today|آج|aj/.test(lower)
      ? "today"
      : "tomorrow"
  return {
    crop,
    quantityKg: kg,
    location,
    readyText,
    confidence: { crop: 0.96, quantity: 0.87, location: 0.92 },
    source: "fallback",
  }
}

export async function extractLot(text: string, lang: Lang = "en"): Promise<LotExtraction> {
  const d = await callProxy({ action: "extract", text, lang })
  if (!d.ok) {
    lastAiError = d.error ?? "Gemini extraction failed"
    return extractLotFallback(text)
  }
  try {
    const raw = JSON.parse((d.text as string) ?? "{}") as Partial<LotExtraction>
    if (!raw.crop || !raw.quantityKg) throw new Error("incomplete extraction")
    return {
      crop: CROP_ALIASES[String(raw.crop).toLowerCase()] ?? raw.crop,
      quantityKg: raw.quantityKg,
      location: CITIES.find((c) => c.toLowerCase() === String(raw.location).toLowerCase()) ?? "Multan",
      readyText: raw.readyText ?? "tomorrow",
      confidence: {
        crop: raw.confidence?.crop ?? 0.9,
        quantity: raw.confidence?.quantity ?? 0.85,
        location: raw.confidence?.location ?? 0.9,
      },
      source: "gemini",
    }
  } catch {
    lastAiError = "Gemini returned a malformed extraction"
    return extractLotFallback(text)
  }
}

const VISION_FALLBACK: VisionResult = {
  grade: "B",
  ripeness: "medium-high",
  defectRate: 0.08,
  notes: [
    "Colour mostly uniform red — some orange fruit still ripening",
    "Light bruising visible on ~8% of fruit",
    "Crates look well ventilated",
  ],
  confidence: 0.74,
  source: "demo",
}

export async function analyzePhoto(
  imageDataUrl: string,
  cropHint: string,
  lang: Lang = "en",
): Promise<VisionResult> {
  if (!imageDataUrl.startsWith("data:")) {
    lastAiError = "No image data to analyze"
    return VISION_FALLBACK
  }
  const [meta, b64] = imageDataUrl.split(",")
  const mimeType = meta.slice(5).split(";")[0] || "image/jpeg"
  const d = await callProxy({ action: "vision", imageBase64: b64, mimeType, cropHint, lang })
  if (!d.ok) {
    lastAiError = d.error ?? "Gemini vision failed"
    return VISION_FALLBACK
  }
  try {
    const raw = JSON.parse((d.text as string) ?? "{}") as Partial<VisionResult>
    return {
      grade: (["A", "B", "C"].includes(String(raw.grade)) ? raw.grade : "B") as Grade,
      ripeness: raw.ripeness ?? "medium",
      defectRate: raw.defectRate ?? 0.08,
      notes: raw.notes?.slice(0, 4) ?? VISION_FALLBACK.notes,
      confidence: raw.confidence ?? 0.7,
      source: "gemini",
    }
  } catch {
    lastAiError = "Gemini returned a malformed vision result"
    return VISION_FALLBACK
  }
}

export interface ChatContext {
  lotSummary: string
  scenariosSummary: string
  pricesSummary: string
}

export async function agentChat(
  history: { role: "user" | "agent"; text: string }[],
  ctx: ChatContext,
  lang: Lang = "en",
): Promise<string> {
  const fallback = chatFallback(history, lang)
  const d = await callProxy({ action: "chat", history, ctx, lang })
  if (!d.ok) {
    lastAiError = d.error ?? "Gemini chat failed"
    return fallback
  }
  const text = String(d.text ?? "").trim()
  return text || fallback
}

function chatFallback(history: { role: "user" | "agent"; text: string }[], lang: Lang = "en"): string {
  const last = history.filter((m) => m.role === "user").at(-1)?.text.toLowerCase() ?? ""

  if (lang === "ur") {
    if (last.includes("karachi") || last.includes("کراچی")) {
      return "کراچی میں ریٹ زیادہ ہے، لیکن ملتان سے ~900 کلومیٹر ہے — 2 دن سڑک پر۔ 800 کلو ٹماٹر کے لیے ~16–19% خرابی کھلے ٹرک میں، плюс PKR 24,000+ ٹرانسپورٹ۔ نقصان کے بعد، کراچی آپ کو لاہور آپشن سے کم دیتا ہے۔"
    }
    if (last.includes("why") || last.includes("recommend") || last.includes("کیوں") || last.includes("تجویز")) {
      return "لاہور خریدار کی تجویز اس لیے: (1) لاہور کا ریٹ آج ملتان سے ~42% زیادہ ہے، (2) الکرم گریڈ B قبول کرتا ہے اور پورے 800 کلو لے سکتا ہے، (3) 7 گھنٹے کا راستہ اتنا چھوٹا ہے کہ ریفریجریٹڈ ٹرانسپورٹ ضروری نہیں — صرف 9 بجے سے پہلے کریٹ میں بھیجیں، اور (4) ان کی تاریخی قبولیت کی شرح 82% ہے۔"
    }
    if (last.includes("store") || last.includes("wait") || last.includes("انتظار") || last.includes("ذخیرہ")) {
      return "انتظار خطرہ بڑھاتا ہے: اگست کی گرمی میں درمیانے پکے ٹماٹر جلدی خراب ہوتے ہیں۔ کولڈ سٹوریج (PKR 3.5/کلو/دن) خرابی کم کرتا ہے لیکن ریٹ بڑھنے کی گارنٹی نہیں — آج کوئی مثبت رجحان نہیں، اس لیے کل لاہور کو بیچنا ذخیرے سے بہتر ہے۔"
    }
    if (last.includes("price") || last.includes("rate") || last.includes("mandi") || last.includes("ریٹ") || last.includes("منڈی")) {
      return "آج کے ٹماٹر کے ریٹ (PKR/کلو): ملتان 62 · فیصل آباد 70 · اسلام آباد 84 · لاہور 96 · کراچی 105۔ ٹرانسپورٹ اور خرابی شامل کرنے کے بعد لاہور سب سے بہتر ہے۔ ریٹ ٹائم سٹیمپ اور اعتماد سکور کے ساتھ اوپر ٹکر میں دکھائے گئے ہیں۔"
    }
    return "میں منڈیوں کا موازنہ، ٹرانسپورٹ اور خرابی کے بعد آپ کی خالص آمدنی کا تخمینہ، خریداروں سے رابطہ، یا ٹرانسپورٹ بک کر سکتا ہوں — آپ کی منظوری کے بغیر کچھ نہیں بھیجا جاتا۔ 'لاہور کیوں؟' پوچھیں یا نیچے تجویز پر ٹیپ کریں۔"
  }

  if (last.includes("karachi")) {
    return "Karachi pays more per kg, but from Multan it's ~900 km — 2 days on the road. For 800 kg tomatoes that means ~16–19% spoilage in an open truck, plus PKR 24,000+ transport. After losses, Karachi nets you LESS than the Lahore option. That's why it's not in your top options."
  }
  if (last.includes("why") || last.includes("recommend")) {
    return "The Lahore buyer is recommended because: (1) Lahore price is ~42% above Multan today, (2) Al-Karam accepts Grade B and can take the full 800 kg, (3) the 7-hour route is short enough that refrigerated transport isn't essential — just dispatch before 9 AM in crates, and (4) their historical acceptance rate is 82%."
  }
  if (last.includes("store") || last.includes("wait")) {
    return "Waiting adds risk: tomatoes at medium-high ripeness in August heat lose value fast. Cold storage (PKR 3.5/kg/day) cuts spoilage but the price isn't guaranteed to rise tomorrow — today there's no confirmed uptrend, so selling tomorrow to Lahore beats storing."
  }
  if (last.includes("price") || last.includes("rate") || last.includes("mandi")) {
    return "Today's tomato prices (PKR/kg): Multan 62 · Faisalabad 70 · Islamabad 84 · Lahore 96 · Karachi 105. Lahore is the best value once transport and spoilage are counted. Prices carry timestamps and confidence scores in the ticker above."
  }
  return "I can compare markets, estimate your net earnings after transport and spoilage, contact buyers, or book transport — nothing is sent without your approval. Try asking 'why Lahore?' or tap a suggestion below."
}

/* ──── Phase 3: ADK Agent client wrappers ──── */

export interface AgentTurnResult {
  ok: boolean
  sessionId?: string
  text: string
  toolCalls: Array<{ name: string; args: Record<string, unknown> }>
  requiresApproval: Array<{ name: string; args: Record<string, unknown> }>
  error?: string
}

/**
 * Send a user message to the ADK agent runtime in the Edge Function.
 * Returns the agent's text response, tool calls, and any actions requiring approval.
 */
export async function agentTurn(
  sessionId: string,
  message: string,
  context?: { lotContext?: Record<string, unknown>; orderContext?: Record<string, unknown> },
): Promise<AgentTurnResult> {
  const d = await callProxy({
    action: "agent-turn",
    sessionId,
    userMessage: sanitizeForLLM(message),
    ...context,
  })
  if (!d.ok) {
    lastAiError = d.error ?? "Agent turn failed"
    return { ok: false, text: "", toolCalls: [], requiresApproval: [], error: d.error }
  }
  return {
    ok: true,
    sessionId: (d.sessionId as string) ?? sessionId,
    text: String(d.text ?? "").trim(),
    toolCalls: (d.toolCalls as AgentTurnResult["toolCalls"]) ?? [],
    requiresApproval: (d.requiresApproval as AgentTurnResult["requiresApproval"]) ?? [],
  }
}

/**
 * Execute approved write tools via the agent runtime.
 */
export async function agentExecuteApproved(
  sessionId: string,
  approvedToolCalls: Array<{ name: string; args: Record<string, unknown> }>,
): Promise<AgentTurnResult> {
  const d = await callProxy({
    action: "agent-execute-approved",
    sessionId,
    approvedToolCalls,
  })
  if (!d.ok) {
    lastAiError = d.error ?? "Agent execute failed"
    return { ok: false, text: "", toolCalls: [], requiresApproval: [], error: d.error }
  }
  return {
    ok: true,
    sessionId: (d.sessionId as string) ?? sessionId,
    text: String(d.text ?? "").trim(),
    toolCalls: (d.toolCalls as AgentTurnResult["toolCalls"]) ?? [],
    requiresApproval: [],
  }
}
