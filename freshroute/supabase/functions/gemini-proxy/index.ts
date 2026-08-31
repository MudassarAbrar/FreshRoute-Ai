// FreshRoute gemini-proxy — the ONLY place the Gemini API key lives.
// Deploy: supabase functions deploy gemini-proxy
// Secret: supabase secrets set GEMINI_API_KEY=your_key
//
// POST { action: "extract" | "vision" | "chat" | "agent-turn" | "status", ... }
// Auth:  caller's Supabase JWT (verified) — no anonymous access.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// ADK via Deno npm: (Phase 3 — Google Agent SDK)
import { LlmAgent, FunctionTool, InMemoryRunner } from "npm:@google/adk";
import { z } from "npm:zod";

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

async function gemini(body: unknown): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
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
    const text: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: `Network error calling Gemini: ${e instanceof Error ? e.message : "unknown"}` };
  }
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

  // ── agent-turn: ADK agent with full function-calling loop ──────
  if (action === "agent-turn") {
    const sessionId = String(payload.sessionId ?? `session-${userId}-${Date.now()}`);
    const userMessage = String(payload.userMessage ?? "").slice(0, 4000);
    if (!userMessage.trim()) return bad("No message for agent turn");

    try {
      // Get or create runner for this session
      let runner = sessionRunners.get(sessionId);
      if (!runner) {
        const agent = new LlmAgent({
          name: "freshroute_agent",
          model: "gemini-2.5-flash",
          instruction: AGENT_INSTRUCTION,
          tools: buildAgentTools(admin, userId),
        });
        runner = new InMemoryRunner({ agent });
        sessionRunners.set(sessionId, runner);
        // Evict old sessions (keep last 50)
        if (sessionRunners.size > 50) {
          const oldest = sessionRunners.keys().next().value;
          if (oldest) sessionRunners.delete(oldest);
        }
      }

      // Create or reuse session
      let currentSessionId = sessionId;
      try {
        await runner.sessionService.createSession({ appName: runner.appName, userId });
      } catch {
        // Session may already exist — use the existing one
      }

      // Run the agent — iterate the async event stream
      let agentText = "";
      const toolCalls: Array<{ name: string; args: Record<string, unknown>; result?: unknown }> = [];
      const requiresApproval: Array<{ name: string; args: Record<string, unknown> }> = [];

      for await (const event of runner.runAsync({
        userId,
        sessionId: currentSessionId,
        newMessage: { role: "user", parts: [{ text: userMessage }] },
      })) {
        // Collect text from agent responses
        if (event.content?.parts) {
          for (const part of event.content.parts) {
            if (part.text && event.author === "freshroute_agent") {
              agentText += part.text;
            }
          }
        }
        // Collect function calls
        if (event.content?.parts) {
          for (const part of event.content.parts) {
            if (part.functionCall) {
              const call = { name: part.functionCall.name, args: (part.functionCall.args ?? {}) as Record<string, unknown> };
              toolCalls.push(call);
              // Write tools flagged for approval
              const writeTools = ["send_offer_message", "book_transport", "book_storage", "update_order_status"];
              if (writeTools.includes(call.name)) {
                requiresApproval.push(call);
              }
            }
          }
        }
        // Log tool calls to agent_action_log
        if (event.content?.parts) {
          for (const part of event.content.parts) {
            if (part.functionCall) {
              void admin.from("agent_action_log").insert({
                agent_run_id: sessionId,
                action_type: part.functionCall.name,
                input: part.functionCall.args ?? {},
                output: {},
                requires_approval: ["send_offer_message", "book_transport", "book_storage", "update_order_status"].includes(part.functionCall.name),
                status: "executed",
              });
            }
          }
        }
      }

      logUsage("ok");
      return new Response(JSON.stringify({
        ok: true,
        sessionId,
        text: agentText,
        toolCalls,
        requiresApproval,
      }), { headers: jsonHeaders });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Agent runtime error";
      logUsage("error", msg);
      return new Response(JSON.stringify({ ok: false, error: msg }), { status: 200, headers: jsonHeaders });
    }
  }

  return bad(`Unknown action "${action}"`);
});

// ─── Phase 3: ADK Agent Runtime ───────────────────────────────────

/** Tool schemas for the FreshRoute ADK agent (mirrors adkAgent.ts) */
function buildAgentTools(admin: ReturnType<typeof createClient>, userId: string) {
  return [
    new FunctionTool({
      name: "get_lot_details",
      description: "Retrieve lot/listing details by ID",
      parameters: z.object({ listingId: z.string() }),
      execute: async ({ listingId }) => {
        const { data } = await admin.from("listings").select("*").eq("id", listingId).maybeSingle();
        return data ?? { error: "Listing not found" };
      },
    }),
    new FunctionTool({
      name: "calculate_spoilage_risk",
      description: "Calculate spoilage risk for a commodity",
      parameters: z.object({
        commodity: z.string(),
        harvestDate: z.string(),
        hours: z.number(),
        transportMode: z.enum(["refrigerated", "ambient", "none"]).optional(),
        handlingEvents: z.number().optional(),
      }),
      execute: async ({ commodity, hours }) => {
        // Simplified spoilage model for agent use
        const baseLoss = Math.min(0.45, hours * 0.004);
        return { expectedLossPct: Math.round(baseLoss * 1000) / 1000, commodity, hours };
      },
    }),
    new FunctionTool({
      name: "search_buyers",
      description: "Search for buyer profiles matching a commodity",
      parameters: z.object({ commodity: z.string(), region: z.string().optional() }),
      execute: async ({ commodity, region }) => {
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
          const commodityMatch = !commodity || commodities.includes(commodity);
          const regionMatch = !region || regions.includes(region);
          return commodityMatch && regionMatch;
        }).map((r: any) => {
          const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {};
          return { userId: r.user_id, name: r.profiles?.full_name, city: r.profiles?.city, ...pj };
        });
      },
    }),
    new FunctionTool({
      name: "get_transport_quotes",
      description: "Get transport provider quotes for a route",
      parameters: z.object({ originCity: z.string(), destCity: z.string(), crop: z.string().optional() }),
      execute: async ({ originCity, destCity }) => {
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
        const dist = distances[originCity]?.[destCity] ?? 350;
        return data.map((r: any) => {
          const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {};
          const ratePerKm = pj.ratePerKm ?? 30;
          return {
            userId: r.user_id, name: r.profiles?.full_name,
            vehicleType: pj.vehicleType, cost: ratePerKm * dist, distKm: dist,
            refrigerated: pj.refrigerated ?? false, onTimePct: pj.onTimePct ?? 75,
          };
        }).sort((a: any, b: any) => a.cost - b.cost);
      },
    }),
    new FunctionTool({
      name: "get_storage_quotes",
      description: "Get storage provider quotes",
      parameters: z.object({ city: z.string(), neededDays: z.number() }),
      execute: async ({ city, neededDays }) => {
        const { data } = await admin
          .from("user_roles")
          .select("id, user_id, profiles!inner(full_name, city), role_profiles(profile_json)")
          .eq("role", "storage_provider")
          .eq("status", "active");
        if (!data) return [];
        return data
          .filter((r: any) => (r.profiles?.city ?? "") === city)
          .map((r: any) => {
            const pj = r.role_profiles?.[0]?.profile_json ?? r.role_profiles?.profile_json ?? {};
            const perKg = pj.perKgPerDay ?? 3.5;
            return { userId: r.user_id, name: r.profiles?.full_name, city, perKgPerDay: perKg, totalCost: perKg * neededDays, verified: pj.verified };
          });
      },
    }),
    new FunctionTool({
      name: "draft_offer_message",
      description: "Draft an offer message to a buyer",
      parameters: z.object({
        buyerName: z.string(), commodity: z.string(), quantity: z.number(),
        grade: z.string(), price: z.number(), location: z.string(),
      }),
      execute: async (p) => ({
        draft: `Assalam-o-Alaikum! I have ${p.quantity} kg Grade ${p.grade} ${p.commodity} in ${p.location}. Asking PKR ${p.price}/kg. Can you take the full lot?`,
        recipient: p.buyerName,
      }),
    }),
    new FunctionTool({
      name: "send_offer_message",
      description: "Send offer to buyer — REQUIRES user approval before executing",
      parameters: z.object({
        listingId: z.string(), price: z.number(), quantity: z.number(), message: z.string(),
      }),
      execute: async (p) => {
        const { data, error } = await admin.from("offers").insert({
          listing_id: p.listingId, offering_user_id: userId,
          price: p.price, quantity: p.quantity, message: p.message, status: "pending",
        }).select("*").single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, offerId: data?.id };
      },
    }),
    new FunctionTool({
      name: "book_transport",
      description: "Book transporter — REQUIRES user approval",
      parameters: z.object({
        orderId: z.string(), transporterUserId: z.string(),
        pickupWindow: z.string(), dropoffWindow: z.string(), rate: z.number(),
      }),
      execute: async (p) => {
        const { data, error } = await admin.from("transport_bookings").insert({
          order_id: p.orderId, transporter_user_id: p.transporterUserId,
          pickup_window: p.pickupWindow, dropoff_window: p.dropoffWindow,
          rate: p.rate, status: "pending",
        }).select("*").single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, bookingId: data?.id };
      },
    }),
    new FunctionTool({
      name: "book_storage",
      description: "Book storage — REQUIRES user approval",
      parameters: z.object({
        orderOrLotId: z.string(), storageUserId: z.string(),
        startDate: z.string(), endDate: z.string(), rate: z.number(),
      }),
      execute: async (p) => {
        const { data, error } = await admin.from("storage_bookings").insert({
          order_id_or_lot_id: p.orderOrLotId, storage_user_id: p.storageUserId,
          start_date: p.startDate, end_date: p.endDate,
          rate: p.rate, status: "pending",
        }).select("*").single();
        if (error) return { ok: false, error: error.message };
        return { ok: true, bookingId: data?.id };
      },
    }),
    new FunctionTool({
      name: "schedule_reminder",
      description: "Schedule a reminder for a future action",
      parameters: z.object({ at: z.string(), message: z.string() }),
      execute: async (p) => ({ scheduled: true, at: p.at, message: p.message }),
    }),
    new FunctionTool({
      name: "update_order_status",
      description: "Update order status — REQUIRES approval for financial changes",
      parameters: z.object({
        orderId: z.string(), status: z.string(), previousStatus: z.string().optional(),
      }),
      execute: async (p) => {
        await admin.from("orders").update({ status: p.status }).eq("id", p.orderId);
        await admin.from("order_events").insert({
          order_id: p.orderId, event_type: "STATUS_CHANGED",
          payload: { newStatus: p.status, previousStatus: p.previousStatus },
        });
        return { updated: true, orderId: p.orderId, newStatus: p.status };
      },
    }),
  ];
}

/** Session runner cache for multi-turn ADK conversations */
const sessionRunners = new Map<string, InstanceType<typeof InMemoryRunner>>();

const AGENT_INSTRUCTION = `You are FreshRoute Agent, an AI selling assistant for Pakistani farmers and produce traders.
Help sellers get the best price by: extracting lot details, analyzing spoilage risk, matching to buyers/transport/storage, drafting offers, and booking services.
Domain: spoilage, recommendations, matching, booking, tracking, reminders, orders, listings.
If asked about anything else, deflect: "I can help with selling produce, finding buyers, transport, storage, pricing and spoilage."
Default to Urdu when the user writes in Urdu, English when they write in English.
Before executing send_offer_message, book_transport, book_storage, or update_order_status, present the action details and wait for explicit user approval.`;

