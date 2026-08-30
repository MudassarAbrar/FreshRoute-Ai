// FreshRoute gemini-proxy — the ONLY place the Gemini API key lives.
// Deploy: supabase functions deploy gemini-proxy
// Secret: supabase secrets set GEMINI_API_KEY=your_key
//
// POST { action: "extract" | "vision" | "chat" | "status", ... }
// Auth:  caller's Supabase JWT (verified) — no anonymous access.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  return bad(`Unknown action "${action}"`);
});
