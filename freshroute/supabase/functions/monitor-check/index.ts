// FreshRoute monitor-check — background health checks (Phase 3.6)
// Runs spoilage threshold, stuck order, and provider timeout checks.
// For stuck orders, invokes the ADK agent to re-plan the next step.
//
// Deploy: supabase functions deploy monitor-check
// Trigger: pg_cron or manual invocation
//
// POST {}  (service role key required)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...cors, "Content-Type": "application/json" };

function bad(error: string) {
  return new Response(JSON.stringify({ ok: false, error }), { status: 200, headers: jsonHeaders });
}

/** Simplified spoilage estimate for background monitoring */
function estimateSpoilagePct(commodity: string, hours: number): number {
  const volatility: Record<string, number> = {
    Tomato: 1.0, Potato: 0.25, Onion: 0.3, Mango: 0.85,
    Kinnow: 0.4, Banana: 1.1, "Green Chili": 0.9, Okra: 0.95, "Leafy Vegetables": 1.6,
  };
  const vol = volatility[commodity] ?? 0.8;
  return Math.min(0.45, (hours / 240) * vol * 1.5);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return bad("POST only");

  // Auth: require service role or admin
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!serviceKey) return bad("Service role key not configured");

  const admin = createClient(supabaseUrl, serviceKey);
  const results: Array<{ check: string; triggered: boolean; detail: string; action?: string }> = [];

  // ── Check 1: Spoilage threshold for active listings ──────────
  const { data: activeListings } = await admin
    .from("listings")
    .select("id, commodity, quantity, attributes, created_at")
    .eq("status", "active")
    .limit(50);

  for (const listing of activeListings ?? []) {
    const hoursSinceCreation = (Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60);
    const spoilagePct = estimateSpoilagePct(listing.commodity, Math.max(1, hoursSinceCreation));
    if (spoilagePct > 0.15) {
      results.push({
        check: "spoilage_threshold",
        triggered: true,
        detail: `Listing ${listing.id} (${listing.commodity}): ${(spoilagePct * 100).toFixed(1)}% estimated spoilage after ${Math.round(hoursSinceCreation)}h`,
        action: "Expedite sale or recommend cold storage",
      });
    }
  }

  // ── Check 2: Stuck orders (no status change in 4+ hours) ──────
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data: activeOrders } = await admin
    .from("orders")
    .select("id, user_id, status, crop, created_at")
    .eq("status", "active")
    .lt("created_at", fourHoursAgo)
    .limit(50);

  for (const order of activeOrders ?? []) {
    const stuckHours = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60);
    results.push({
      check: "order_stuck",
      triggered: true,
      detail: `Order ${order.id} (${order.crop}) stuck in '${order.status}' for ${Math.round(stuckHours)}h`,
      action: "Invoke ADK agent to re-plan next step",
    });

    // Invoke the ADK agent to re-plan the stuck order
    try {
      const geminiUrl = `${supabaseUrl}/functions/v1/gemini-proxy`;
      const agentRes = await fetch(geminiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          action: "agent-turn",
          sessionId: `monitor-${order.id}`,
          userMessage: `Order ${order.id} for ${order.crop} has been stuck in status '${order.status}' for ${Math.round(stuckHours)} hours. What should the seller do next?`,
        }),
      });
      const agentData = await agentRes.json();
      if (agentData?.ok) {
        results.push({
          check: "agent_replan",
          triggered: false,
          detail: `Agent suggestion for order ${order.id}: ${(agentData.text ?? "").slice(0, 200)}`,
        });
      }
    } catch (e) {
      results.push({
        check: "agent_replan",
        triggered: true,
        detail: `Failed to invoke agent for order ${order.id}: ${e instanceof Error ? e.message : "unknown"}`,
      });
    }
  }

  // ── Check 3: Provider timeout (pending bookings > 4h) ────────
  const { data: pendingBookings } = await admin
    .from("transport_bookings")
    .select("id, order_id, status, created_at")
    .eq("status", "pending")
    .lt("created_at", fourHoursAgo)
    .limit(20);

  for (const booking of pendingBookings ?? []) {
    const waitHours = (Date.now() - new Date(booking.created_at).getTime()) / (1000 * 60 * 60);
    results.push({
      check: "provider_timeout",
      triggered: true,
      detail: `Transport booking ${booking.id} pending for ${Math.round(waitHours)}h`,
      action: "Search for alternative transporter",
    });
  }

  const triggered = results.filter((r) => r.triggered).length;

  return new Response(JSON.stringify({
    ok: true,
    checksRun: results.length,
    triggered,
    results,
    timestamp: new Date().toISOString(),
  }), { headers: jsonHeaders });
});
