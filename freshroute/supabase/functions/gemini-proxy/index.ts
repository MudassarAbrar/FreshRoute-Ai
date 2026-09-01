// FreshRoute AI proxy — the ONLY place the Gemini API key lives.
// Deploy (frontend invokes "smart-action"; "gemini-proxy" is kept as an alias):
//   supabase functions deploy smart-action --project-ref tlfncoyrtsscirfnbvzg
//   supabase functions deploy gemini-proxy --project-ref tlfncoyrtsscirfnbvzg
// Secret: supabase secrets set GEMINI_API_KEY=your_key
//
// POST { action: "status" | "extract" | "vision" | "chat" | "agent-turn" | "agent-execute-approved", ... }
// Auth:  caller's Supabase JWT (verified) — no anonymous access.
//
// NOTE: keep this file dependency-light. Importing npm:@google/adk here made the
// worker exceed the Edge Runtime size limit and crash on boot (BOOT_ERROR), so
// the agent loop is implemented with native Gemini function calling instead.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { transitionOrder, type OrderStatus } from "../_shared/orderStateMachine.ts";
import { checkAgentRateLimit, checkGlobalRateLimit, rateLimitedResponse } from "../_shared/serverRateLimiter.ts";
import { sanitizeInput } from "../_shared/inputSanitizer.ts";

const MODEL = "gemini-flash-latest";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const langNote = (lang: string) =>
  lang === "ur"
    ? "IMPORTANT: Respond in Urdu (اردو). Keep numbers in Western digits. Keep buyer/city names in their original form."
    : "Respond in English.";

const jsonHeaders = { ...cors, "Content-Type": "application/json" };

function bad(error: string) {
  // HTTP 200 by design: functions.invoke surfaces app errors as parsed JSON, not thrown HTTP errors
  return new Response(JSON.stringify({ ok: false, error }), { status: 200, headers: jsonHeaders });
}

/** Call Gemini generateContent and return the raw parsed response. */
async function geminiRaw(
  body: unknown,
): Promise<{ ok: true; data: Record<string, any> } | { ok: false; error: string }> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-goog-api-key": GEMINI_KEY },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const detail = await res.text();
      const msg =
        res.status === 400 && /API key/i.test(detail)
          ? "Gemini rejected the API key (invalid key on server)"
          : res.status === 404
            ? `Model ${MODEL} not available for this key`
            : res.status === 429
              ? "Gemini rate limit reached — try again shortly"
              : `Gemini error ${res.status}`;
      return { ok: false, error: msg };
    }
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: `Network error calling Gemini: ${e instanceof Error ? e.message : "unknown"}` };
  }
}

/** Call Gemini and extract the concatenated text of the first candidate. */
async function gemini(body: unknown): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const r = await geminiRaw(body);
  if (!r.ok) return r;
  const text: string =
    r.data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  return { ok: true, text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return bad("POST only");

  // ── auth: verify the caller's JWT ──────────────────────────────
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return bad("Missing auth token");
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return bad("Invalid or expired session");
  const userId = userData.user.id;

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return bad("Invalid JSON body");
  }
  const action = String(payload.action ?? "");
  const lang = payload.lang === "ur" ? "ur" : "en";
  const started = Date.now();

  // service client for ai_usage logging (bypasses RLS)
  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const logUsage = (status: "ok" | "error", error?: string) => {
    void admin.from("ai_usage").insert({
      user_id: userId,
      action,
      model: MODEL,
      status,
      error: error ?? null,
      latency_ms: Date.now() - started,
    });
  };

  // ── Phase 7: Server-side rate limiting ──────────────────────────
  const globalLimit = checkGlobalRateLimit(userId);
  if (!globalLimit.allowed) return rateLimitedResponse(globalLimit);

  if (action === "agent-turn" || action === "agent-execute-approved") {
    const agentLimit = checkAgentRateLimit(userId);
    if (!agentLimit.allowed) return rateLimitedResponse(agentLimit);
  }

  // ── Phase 7: Input sanitization ─────────────────────────────────
  if (payload.userMessage && typeof payload.userMessage === "string") {
    const sanitized = sanitizeInput(payload.userMessage);
    payload.userMessage = sanitized.sanitized;
  }

  // ── status: is the server key configured & valid? ──────────────
  if (action === "status") {
    if (!GEMINI_KEY) {
      return new Response(
        JSON.stringify({ ok: true, configured: false, valid: false, mode: "demo" }),
        { headers: jsonHeaders },
      );
    }
    const ping = await gemini({
      contents: [{ role: "user", parts: [{ text: "Reply with the single word: ok" }] }],
      generationConfig: { maxOutputTokens: 5 },
    });
    if (!ping.ok) logUsage("error", ping.error);
    else logUsage("ok");
    return new Response(
      JSON.stringify({
        ok: true,
        configured: true,
        valid: ping.ok,
        mode: ping.ok ? "live" : "error",
        error: ping.ok ? undefined : ping.error,
        model: MODEL,
      }),
      { headers: jsonHeaders },
    );
  }

  if (!GEMINI_KEY) {
    logUsage("error", "GEMINI_API_KEY not configured");
    return new Response(
      JSON.stringify({
        ok: false,
        mode: "demo",
        error: "GEMINI_API_KEY is not configured on the server — running in demo mode",
      }),
      { status: 200, headers: jsonHeaders },
    );
  }

  // ── extract: farmer message → structured lot ───────────────────
  if (action === "extract") {
    const text = String(payload.text ?? "").slice(0, 4000);
    if (!text.trim()) return bad("Nothing to extract");
    const result = await gemini({
      systemInstruction: {
        parts: [{ text: `${langNote(lang)} Return ONLY JSON matching the schema. Canonical crop and city values stay in English.` }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `Extract the produce lot from this farmer message (may be Urdu, Roman Urdu or English): "${text}". ` +
                `Supported crops: Tomato, Potato, Onion, Mango, Kinnow, Banana, Green Chili, Okra, Leafy Vegetables. ` +
                `Cities: Multan, Lahore, Faisalabad, Islamabad, Karachi. If quantity is in maund, convert to kg (1 maund = 37.32 kg).`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            crop: { type: "string" },
            quantityKg: { type: "number" },
            location: { type: "string" },
            readyText: { type: "string", description: "today | tomorrow | a short date phrase" },
            confidence: {
              type: "object",
              properties: { crop: { type: "number" }, quantity: { type: "number" }, location: { type: "number" } },
              required: ["crop", "quantity", "location"],
            },
          },
          required: ["crop", "quantityKg", "location", "readyText", "confidence"],
        },
      },
    });
    if (!result.ok) {
      logUsage("error", result.error);
      return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 200, headers: jsonHeaders });
    }
    logUsage("ok");
    return new Response(JSON.stringify({ ok: true, text: result.text }), { headers: jsonHeaders });
  }

  // ── vision: produce photo → quality grade ──────────────────────
  if (action === "vision") {
    const imageBase64 = String(payload.imageBase64 ?? "");
    const mimeType = String(payload.mimeType ?? "image/jpeg");
    const cropHint = String(payload.cropHint ?? "produce").slice(0, 100);
    if (!imageBase64) return bad("No image provided");
    if (imageBase64.length > 7_000_000) return bad("Image too large");
    const result = await gemini({
      systemInstruction: { parts: [{ text: langNote(lang) }] },
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            {
              text:
                `This is a farmer's photo of ${cropHint} for sale in Pakistan. Estimate visible quality. ` +
                `This is a visual estimate only — never claim lab-grade certification. Respond in JSON.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            grade: { type: "string", description: "A | B | C" },
            ripeness: { type: "string", description: "low | medium | medium-high | high" },
            defectRate: { type: "number", description: "0-1 visible defect fraction" },
            notes: { type: "array", items: { type: "string" } },
            confidence: { type: "number" },
          },
          required: ["grade", "ripeness", "defectRate", "notes", "confidence"],
        },
      },
    });
    if (!result.ok) {
      logUsage("error", result.error);
      return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 200, headers: jsonHeaders });
    }
    logUsage("ok");
    return new Response(JSON.stringify({ ok: true, text: result.text }), { headers: jsonHeaders });
  }

  // ── chat: free-form assistant conversation ─────────────────────
  if (action === "chat") {
    const history = Array.isArray(payload.history) ? payload.history.slice(-10) : [];
    const ctx = payload.ctx as { lotSummary?: string; scenariosSummary?: string; pricesSummary?: string } ?? {};
    const contents = [
      {
        role: "user",
        parts: [
          {
            text:
              `CONTEXT:\nLot: ${ctx.lotSummary ?? "none"}\nScenarios: ${ctx.scenariosSummary ?? "none"}\nPrices: ${ctx.pricesSummary ?? "none"}`,
          },
        ],
      },
      { role: "model", parts: [{ text: "Understood. I will only use these figures." }] },
      ...history.map((m: { role?: string; text?: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: String(m.text ?? "").slice(0, 2000) }],
      })),
    ];
    const result = await gemini({
      systemInstruction: {
        parts: [
          {
            text:
              `You are FreshRoute Agent, an AI selling assistant for Pakistani farmers and produce traders.\n` +
              `You help decide where, when and how to sell perishable produce — then execute outreach, transport and storage bookings, ALWAYS with explicit user approval before any outbound action.\n\n` +
              `Rules:\n- Be concise (max 90 words), warm and practical. The user may be a farmer with basic literacy.\n` +
              `- NEVER invent market prices. Only use prices given in the context below.\n` +
              `- Distinguish facts from estimates. If unsure, say so.\n- Prices are in PKR per kg.\n` +
              `- End with a helpful next step when natural.\n- ${langNote(lang)}`,
          },
        ],
      },
      contents,
      generationConfig: { temperature: 0.7 },
    });
    if (!result.ok) {
      logUsage("error", result.error);
      return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 200, headers: jsonHeaders });
    }
    logUsage("ok");
    return new Response(JSON.stringify({ ok: true, text: result.text }), { headers: jsonHeaders });
  }

  // ── agent-turn: native function-calling agent loop ─────────────
  if (action === "agent-turn") {
    const sessionId = String(payload.sessionId ?? `session-${userId}-${Date.now()}`);
    const userMessage = String(payload.userMessage ?? "").slice(0, 4000);
    if (!userMessage.trim()) return bad("No message for agent turn");

    try {
      const result = await runAgentTurn({ sessionId, userMessage, admin, userId });
      if (!result.ok) {
        logUsage("error", result.error);
        return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 200, headers: jsonHeaders });
      }
      logUsage("ok");
      return new Response(JSON.stringify({
        ok: true,
        sessionId,
        text: result.text,
        toolCalls: result.toolCalls,
        requiresApproval: result.requiresApproval,
      }), { headers: jsonHeaders });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Agent runtime error";
      logUsage("error", msg);
      return new Response(JSON.stringify({ ok: false, error: msg }), { status: 200, headers: jsonHeaders });
    }
  }

  // ── agent-execute-approved: run write tools the user approved ──
  if (action === "agent-execute-approved") {
    const sessionId = String(payload.sessionId ?? "");
    const approved = Array.isArray(payload.approvedToolCalls) ? payload.approvedToolCalls : [];
    if (!approved.length) return bad("No approved tool calls provided");
    const results: Array<Record<string, unknown>> = [];
    for (const call of approved) {
      const name = String((call as { name?: string })?.name ?? "");
      const args = ((call as { args?: Record<string, unknown> })?.args ?? {}) as Record<string, unknown>;
      if (!WRITE_TOOLS.includes(name)) {
        results.push({ name, ok: false, error: "Not an approvable write tool" });
        continue;
      }
      const outcome = await executeWriteTool(name, args, admin, userId);
      results.push({ name, ...outcome });
      void admin.from("agent_action_log").insert({
        agent_run_id: sessionId,
        action_type: name,
        input: args,
        output: outcome,
        requires_approval: true,
        status: outcome.error ? "failed" : "executed",
      });
    }
    logUsage("ok");
    return new Response(JSON.stringify({
      ok: true,
      sessionId,
      text: "",
      toolCalls: approved,
      requiresApproval: [],
      results,
    }), { headers: jsonHeaders });
  }

  return bad(`Unknown action "${action}"`);
});

// ─── Agent runtime — native Gemini function calling (no ADK) ──────
// The ADK npm package exceeded the Edge Runtime worker size limit and made the
// function crash on boot, so this loop talks to the Gemini REST API directly.

type Part = {
  text?: string;
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: unknown };
};
type Content = { role: "user" | "model"; parts: Part[] };

/** Write tools are never executed without explicit user approval. */
const WRITE_TOOLS = ["send_offer_message", "book_transport", "book_storage", "update_order_status"];

/** Tool schemas for the FreshRoute agent (mirrors adkAgent.ts). */
const TOOL_DECLARATIONS = [
  {
    name: "get_lot_details",
    description: "Retrieve lot/listing details by ID",
    parameters: {
      type: "object",
      properties: { listingId: { type: "string" } },
      required: ["listingId"],
    },
  },
  {
    name: "calculate_spoilage_risk",
    description: "Calculate spoilage risk for a commodity",
    parameters: {
      type: "object",
      properties: {
        commodity: { type: "string" },
        harvestDate: { type: "string" },
        hours: { type: "number" },
        transportMode: { type: "string", enum: ["refrigerated", "ambient", "none"] },
        handlingEvents: { type: "number" },
      },
      required: ["commodity", "harvestDate", "hours"],
    },
  },
  {
    name: "search_buyers",
    description: "Search for buyer profiles matching a commodity",
    parameters: {
      type: "object",
      properties: { commodity: { type: "string" }, region: { type: "string" } },
      required: ["commodity"],
    },
  },
  {
    name: "get_transport_quotes",
    description: "Get transport provider quotes for a route",
    parameters: {
      type: "object",
      properties: { originCity: { type: "string" }, destCity: { type: "string" }, crop: { type: "string" } },
      required: ["originCity", "destCity"],
    },
  },
  {
    name: "get_storage_quotes",
    description: "Get storage provider quotes",
    parameters: {
      type: "object",
      properties: { city: { type: "string" }, neededDays: { type: "number" } },
      required: ["city", "neededDays"],
    },
  },
  {
    name: "draft_offer_message",
    description: "Draft an offer message to a buyer (does not send anything)",
    parameters: {
      type: "object",
      properties: {
        buyerName: { type: "string" },
        commodity: { type: "string" },
        quantity: { type: "number" },
        grade: { type: "string" },
        price: { type: "number" },
        location: { type: "string" },
      },
      required: ["buyerName", "commodity", "quantity", "grade", "price", "location"],
    },
  },
  {
    name: "send_offer_message",
    description: "Send offer to buyer — REQUIRES user approval before executing",
    parameters: {
      type: "object",
      properties: {
        listingId: { type: "string" },
        price: { type: "number" },
        quantity: { type: "number" },
        message: { type: "string" },
      },
      required: ["listingId", "price", "quantity", "message"],
    },
  },
  {
    name: "book_transport",
    description: "Book transporter — REQUIRES user approval before executing",
    parameters: {
      type: "object",
      properties: {
        orderId: { type: "string" },
        transporterUserId: { type: "string" },
        pickupWindow: { type: "string" },
        dropoffWindow: { type: "string" },
        rate: { type: "number" },
      },
      required: ["orderId", "transporterUserId", "pickupWindow", "dropoffWindow", "rate"],
    },
  },
  {
    name: "book_storage",
    description: "Book storage — REQUIRES user approval before executing",
    parameters: {
      type: "object",
      properties: {
        orderOrLotId: { type: "string" },
        storageUserId: { type: "string" },
        startDate: { type: "string" },
        endDate: { type: "string" },
        rate: { type: "number" },
      },
      required: ["orderOrLotId", "storageUserId", "startDate", "endDate", "rate"],
    },
  },
  {
    name: "schedule_reminder",
    description: "Schedule a reminder for a future action",
    parameters: {
      type: "object",
      properties: { at: { type: "string" }, message: { type: "string" } },
      required: ["at", "message"],
    },
  },
  {
    name: "update_order_status",
    description: "Update order status — REQUIRES user approval before executing",
    parameters: {
      type: "object",
      properties: {
        orderId: { type: "string" },
        status: { type: "string" },
        previousStatus: { type: "string" },
      },
      required: ["orderId", "status"],
    },
  },
];

const AGENT_INSTRUCTION = `You are FreshRoute Agent, an AI selling assistant for Pakistani farmers and produce traders.
Help sellers get the best price by: extracting lot details, analyzing spoilage risk, matching to buyers/transport/storage, drafting offers, and booking services.
Domain: spoilage, recommendations, matching, booking, tracking, reminders, orders, listings.
If asked about anything else, deflect: "I can help with selling produce, finding buyers, transport, storage, pricing and spoilage."
Default to Urdu when the user writes in Urdu, English when they write in English.
Before executing send_offer_message, book_transport, book_storage, or update_order_status, present the action details and wait for explicit user approval.`;

/**
 * DB-backed session persistence — replaces in-memory Map so sessions
 * survive Edge Function cold starts. Falls back to in-memory if DB writes fail.
 */
const MAX_SESSION_CONTENTS = 30;
const sessionFallback = new Map<string, Content[]>();

async function loadSession(
  sessionId: string,
  admin: ReturnType<typeof createClient>,
): Promise<Content[]> {
  // Try DB first
  const { data, error } = await admin
    .from("agent_sessions")
    .select("contents")
    .eq("id", sessionId)
    .maybeSingle();
  if (data && !error) {
    return (data.contents as Content[]) ?? [];
  }
  // Fallback to in-memory (cold start before migration applied, etc.)
  return sessionFallback.get(sessionId) ?? [];
}

async function saveSession(
  sessionId: string,
  userId: string,
  contents: Content[],
  admin: ReturnType<typeof createClient>,
): Promise<void> {
  // Bound memory
  if (contents.length > MAX_SESSION_CONTENTS) {
    contents.splice(0, contents.length - MAX_SESSION_CONTENTS);
    while (contents.length > 0 && contents[0].role !== "user") contents.shift();
  }
  // Keep in-memory fallback in sync
  sessionFallback.set(sessionId, contents);
  if (sessionFallback.size > 50) {
    const oldest = sessionFallback.keys().next().value;
    if (oldest) sessionFallback.delete(oldest);
  }
  // Persist to DB (best-effort — don't block the response)
  void admin.from("agent_sessions").upsert({
    id: sessionId,
    user_id: userId,
    contents,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });
}

async function runAgentTurn(opts: {
  sessionId: string;
  userMessage: string;
  admin: ReturnType<typeof createClient>;
  userId: string;
}): Promise<
  | { ok: false; error: string }
  | { ok: true; text: string; toolCalls: Array<{ name: string; args: Record<string, unknown> }>; requiresApproval: Array<{ name: string; args: Record<string, unknown> }> }
> {
  const { sessionId, userMessage, admin, userId } = opts;

  let history = await loadSession(sessionId, admin);
  history.push({ role: "user", parts: [{ text: userMessage }] });

  const toolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const requiresApproval: Array<{ name: string; args: Record<string, unknown> }> = [];
  let agentText = "";

  const MAX_STEPS = 6;
  for (let step = 0; step < MAX_STEPS; step++) {
    const r = await geminiRaw({
      systemInstruction: { parts: [{ text: AGENT_INSTRUCTION }] },
      contents: history,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      generationConfig: { temperature: 0.7 },
    });
    if (!r.ok) return { ok: false, error: r.error };

    const parts: Part[] = r.data?.candidates?.[0]?.content?.parts ?? [];
    history.push({ role: "model", parts });

    const responses: Part[] = [];
    let hasToolCall = false;
    for (const part of parts) {
      if (part.text) agentText += part.text;
      if (!part.functionCall) continue;
      hasToolCall = true;
      const name = part.functionCall.name;
      const args = (part.functionCall.args ?? {}) as Record<string, unknown>;
      toolCalls.push({ name, args });

      if (WRITE_TOOLS.includes(name)) {
        // Write tools never run without explicit user approval.
        requiresApproval.push({ name, args });
        void admin.from("agent_action_log").insert({
          agent_run_id: sessionId,
          action_type: name,
          input: args,
          output: {},
          requires_approval: true,
          status: "pending_approval",
        });
        responses.push({
          functionResponse: {
            name,
            response: {
              status: "pending_user_approval",
              note: "The user must approve this action before it executes. Present the details and ask for approval.",
            },
          },
        });
      } else {
        const result = await executeReadTool(name, args, admin);
        void admin.from("agent_action_log").insert({
          agent_run_id: sessionId,
          action_type: name,
          input: args,
          output: result,
          requires_approval: false,
          status: "executed",
        });
        responses.push({ functionResponse: { name, response: { result } } });
      }
    }
    if (!hasToolCall) break;
    history.push({ role: "user", parts: responses });
  }

  // Bound memory + persist to DB
  await saveSession(sessionId, userId, history, admin);

  // Phase 2: Anti-fabrication — strip claims about write tools that are still pending approval.
  // Write tools require user approval, so any claim that an action "succeeded" is fabricated.
  const pendingWriteNames = requiresApproval.map((a) => a.name);
  let sanitizedText = agentText;
  if (pendingWriteNames.length > 0) {
    // Replace common fabricated claim patterns
    sanitizedText = sanitizedText
      .replace(/(?:offer|message|proposal)\s+(?:sent|delivered)\s+to\s+.+?on\s+WhatsApp\s*[✓✔️✅]?/gi,
        "Offer prepared — pending your approval to send")
      .replace(/(?:transport|storage)\s+(?:booked|confirmed)\s*[✓✔️✅]?/gi,
        "Booking prepared — pending your approval")
      .replace(/WhatsApp\s+message\s+delivered\s*[✓✔️✅]?/gi,
        "Message queued — awaiting delivery")
      .replace(/read\s+receipt\s+received/gi,
        "Awaiting read confirmation");
  }

  return { ok: true, text: sanitizedText, toolCalls, requiresApproval };
}

/** Execute a read-only tool (safe to run automatically). */
async function executeReadTool(
  name: string,
  p: Record<string, unknown>,
  admin: ReturnType<typeof createClient>,
): Promise<unknown> {
  switch (name) {
    case "get_lot_details": {
      const { data } = await admin.from("listings").select("*").eq("id", String(p.listingId ?? "")).maybeSingle();
      return data ?? { error: "Listing not found" };
    }
    case "calculate_spoilage_risk": {
      const hours = Number(p.hours ?? 0);
      // Simplified spoilage model for agent use
      const baseLoss = Math.min(0.45, hours * 0.004);
      return { expectedLossPct: Math.round(baseLoss * 1000) / 1000, commodity: p.commodity, hours };
    }
    case "search_buyers": {
      const { data } = await admin
        .from("user_roles")
        .select("id, user_id, profiles!inner(full_name, city), role_profiles(profile_json)")
        .eq("role", "buyer")
        .eq("status", "active")
        .limit(10);
      if (!data) return [];
      return data.filter((r: any) => {
        const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {};
        const commodities = pj.typicalCommodities ?? [];
        const regions = pj.deliveryRegions ?? [];
        const commodityMatch = !p.commodity || commodities.includes(p.commodity);
        const regionMatch = !p.region || regions.includes(p.region);
        return commodityMatch && regionMatch;
      }).map((r: any) => {
        const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {};
        return { userId: r.user_id, name: r.profiles?.full_name, city: r.profiles?.city, ...pj };
      });
    }
    case "get_transport_quotes": {
      const { data } = await admin
        .from("user_roles")
        .select("id, user_id, profiles!inner(full_name, city), role_profiles(profile_json)")
        .eq("role", "transporter")
        .eq("status", "active");
      if (!data) return [];
      const distances: Record<string, Record<string, number>> = {
        Multan: { Multan: 15, Lahore: 350, Faisalabad: 250, Islamabad: 340, Karachi: 900 },
        Lahore: { Lahore: 15, Multan: 350, Faisalabad: 180, Islamabad: 375, Karachi: 1210 },
        Faisalabad: { Faisalabad: 15, Multan: 250, Lahore: 180, Islamabad: 300, Karachi: 1100 },
        Islamabad: { Islamabad: 15, Multan: 340, Lahore: 375, Faisalabad: 300, Karachi: 1400 },
        Karachi: { Karachi: 15, Multan: 900, Lahore: 1210, Faisalabad: 1100, Islamabad: 1400 },
      };
      const dist = distances[String(p.originCity)]?.[String(p.destCity)] ?? 350;
      return data.map((r: any) => {
        const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {};
        const ratePerKm = pj.ratePerKm ?? 30;
        return {
          userId: r.user_id, name: r.profiles?.full_name,
          vehicleType: pj.vehicleType, cost: ratePerKm * dist, distKm: dist,
          refrigerated: pj.refrigerated ?? false, onTimePct: pj.onTimePct ?? 75,
        };
      }).sort((a: any, b: any) => a.cost - b.cost);
    }
    case "get_storage_quotes": {
      const { data } = await admin
        .from("user_roles")
        .select("id, user_id, profiles!inner(full_name, city), role_profiles(profile_json)")
        .eq("role", "storage_provider")
        .eq("status", "active");
      if (!data) return [];
      return data
        .filter((r: any) => (r.profiles?.city ?? "") === p.city)
        .map((r: any) => {
          const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {};
          const perKg = pj.perKgPerDay ?? 3.5;
          return { userId: r.user_id, name: r.profiles?.full_name, city: p.city, perKgPerDay: perKg, totalCost: perKg * Number(p.neededDays ?? 0), verified: pj.verified };
        });
    }
    case "draft_offer_message": {
      return {
        draft: `Assalam-o-Alaikum! I have ${p.quantity} kg Grade ${p.grade} ${p.commodity} in ${p.location}. Asking PKR ${p.price}/kg. Can you take the full lot?`,
        recipient: p.buyerName,
      };
    }
    case "schedule_reminder": {
      return { scheduled: true, at: p.at, message: p.message };
    }
    default:
      return { error: `Unknown tool "${name}"` };
  }
}

/** Execute a write tool — only ever called after explicit user approval. */
async function executeWriteTool(
  name: string,
  p: Record<string, unknown>,
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ ok?: boolean; error?: string; [k: string]: unknown }> {
  try {
    switch (name) {
      case "send_offer_message": {
        const { data, error } = await admin.from("offers").insert({
          listing_id: p.listingId, offering_user_id: userId,
          price: p.price, quantity: p.quantity, message: p.message, status: "pending",
        }).select("*").single();
        if (error) return { error: error.message };
        return { ok: true, offerId: data?.id };
      }
      case "book_transport": {
        const { data, error } = await admin.from("transport_bookings").insert({
          order_id: p.orderId, transporter_user_id: p.transporterUserId,
          pickup_window: p.pickupWindow, dropoff_window: p.dropoffWindow,
          rate: p.rate, status: "pending",
        }).select("*").single();
        if (error) return { error: error.message };
        return { ok: true, bookingId: data?.id };
      }
      case "book_storage": {
        const { data, error } = await admin.from("storage_bookings").insert({
          order_id_or_lot_id: p.orderOrLotId, storage_user_id: p.storageUserId,
          start_date: p.startDate, end_date: p.endDate,
          rate: p.rate, status: "pending",
        }).select("*").single();
        if (error) return { error: error.message };
        return { ok: true, bookingId: data?.id };
      }
      case "update_order_status": {
        // Phase 1: Route through state machine instead of direct DB write
        const result = await transitionOrder(admin, p.orderId as string, p.status as OrderStatus, {
          source: "agent",
          actorType: "agent",
          actorId: userId,
          previousStatus: p.previousStatus as string,
        });
        if (!result.ok) {
          return { error: result.error, code: result.code };
        }
        return { updated: true, orderId: result.orderId, previousStatus: result.previousStatus, newStatus: result.newStatus };
      }
      default:
        return { error: `Unknown write tool "${name}"` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Tool execution failed" };
  }
}
