/**
 * Integration Health Endpoint — spec Section 8 (Phase 8).
 *
 * Returns the status of all external integrations so the frontend
 * can display honest simulation badges.
 *
 * GET /integration-health
 * No auth required — this is a public health check.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const jsonHeaders = { ...cors, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET") {
    return new Response("GET only", { status: 405, headers: jsonHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const geminiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
  const whatsappToken = Deno.env.get("WHATSAPP_TOKEN") ?? "";

  const admin = createClient(supabaseUrl, supabaseKey);

  // ─── Gemini AI ───
  const gemini = {
    status: geminiKey ? "live" as const : "not_configured" as const,
    model: "gemini-flash-latest",
    note: geminiKey ? undefined : "Gemini API key not configured. AI responses use demo fallbacks.",
  };

  // ─── WhatsApp ───
  const whatsapp = {
    status: whatsappToken ? "live" as const : "simulated" as const,
    adapter: whatsappToken ? "WhatsAppCloudProvider" : "SimulatedMessagingProvider",
    note: whatsappToken
      ? undefined
      : "WhatsApp credentials not configured. Messages are simulated and labeled.",
  };

  // ─── GPS Routing ───
  const gpsRouting = {
    status: "live" as const,
    provider: "osrm",
    note: "OSRM is free and requires no API key. Falls back to SimulatedProvider on failure.",
  };

  // ─── Price Data ───
  let priceData = {
    status: "none" as "live" | "seed_data" | "none",
    source: "none",
    count: 0,
  };

  try {
    const { data: prices } = await admin
      .from("price_observations")
      .select("id, source, is_demo")
      .limit(5);

    if (prices && prices.length > 0) {
      const hasDemo = prices.some((p: any) => p.is_demo || p.source === "seed");
      priceData = {
        status: hasDemo ? "seed_data" : "live",
        source: hasDemo ? "seed_migration" : "live_feed",
        count: prices.length,
      };
    }
  } catch {
    // Table may not exist yet
  }

  // ─── Weather ───
  const weather = {
    status: "hardcoded" as const,
    note: "Static weather data from cropReference.ts. Replace with a real weather API for production.",
  };

  // ─── Marketplace (buyers/transport/storage) ───
  let marketplace = {
    buyers: { status: "none" as "live" | "db_profiles" | "none", count: 0 },
    transporters: { status: "none" as "live" | "db_profiles" | "none", count: 0 },
    storages: { status: "none" as "live" | "db_profiles" | "none", count: 0 },
  };

  try {
    const [buyerPrefs, transporterCaps, storageFacilities] = await Promise.all([
      admin.from("buyer_preferences").select("id").eq("is_active", true).limit(1),
      admin.from("transporter_capabilities").select("id").eq("is_active", true).limit(1),
      admin.from("storage_facility_details").select("id").eq("is_active", true).limit(1),
    ]);

    marketplace = {
      buyers: {
        status: (buyerPrefs.data?.length ?? 0) > 0 ? "live" : "db_profiles",
        count: buyerPrefs.data?.length ?? 0,
      },
      transporters: {
        status: (transporterCaps.data?.length ?? 0) > 0 ? "live" : "db_profiles",
        count: transporterCaps.data?.length ?? 0,
      },
      storages: {
        status: (storageFacilities.data?.length ?? 0) > 0 ? "live" : "db_profiles",
        count: storageFacilities.data?.length ?? 0,
      },
    };
  } catch {
    // Tables may not exist yet
  }

  // ─── State Machine ───
  const stateMachine = {
    status: "live" as const,
    enforcement: "db_trigger",
    note: "Order status changes enforced via PostgreSQL trigger + shared TypeScript module.",
  };

  // ─── Response ───
  const health = {
    gemini,
    whatsapp,
    gps_routing: gpsRouting,
    price_data: priceData,
    weather,
    marketplace,
    state_machine: stateMachine,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  };

  return new Response(JSON.stringify(health), {
    status: 200,
    headers: {
      ...jsonHeaders,
      "Cache-Control": "public, max-age=30",
    },
  });
});
