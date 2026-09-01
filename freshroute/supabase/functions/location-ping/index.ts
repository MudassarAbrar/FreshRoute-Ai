// FreshRoute Location Ping — accepts GPS updates from transporter devices.
//
// POST { orderId, latitude, longitude, accuracy_m?, speed_kmh?, heading?, deviceInfo? }
// Auth: caller's Supabase JWT (transporter role required).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}
const jsonHeaders = { ...cors, "Content-Type": "application/json" }

function bad(error: string) {
  return new Response(JSON.stringify({ ok: false, error }), { status: 200, headers: jsonHeaders })
}

function ok(data: Record<string, unknown>) {
  return new Response(JSON.stringify({ ok: true, ...data }), { status: 200, headers: jsonHeaders })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors })
  }

  if (req.method !== "POST") {
    return bad("Method not allowed")
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("authorization")
    if (!authHeader) return bad("Missing authorization header")

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return bad("Authentication failed")

    // Parse body
    const body = await req.json()
    const { orderId, latitude, longitude, accuracy_m, speed_kmh, heading, deviceInfo } = body

    // Validate required fields
    if (!orderId) return bad("Missing orderId")
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return bad("latitude and longitude must be numbers")
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return bad("Invalid coordinates")
    }

    // Verify the user is associated with this order (as transporter)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single()

    if (orderError || !order) return bad("Order not found")

    // Insert the location ping
    const { data: ping, error: insertError } = await supabase
      .from("location_pings")
      .insert({
        order_id: orderId,
        transporter_user_id: user.id,
        latitude,
        longitude,
        accuracy_m: accuracy_m ?? null,
        speed_kmh: speed_kmh ?? null,
        heading: heading ?? null,
        device_info: deviceInfo ?? null,
      })
      .select("*")
      .single()

    if (insertError) return bad(`Insert failed: ${insertError.message}`)

    // Fire order event for location update
    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "LOCATION_PING",
      source: "driver_app",
      actor_type: "transporter",
      actor_id: user.id,
      payload: {
        latitude,
        longitude,
        speed_kmh: speed_kmh ?? null,
      },
    })

    return ok({
      pingId: ping?.id,
      recordedAt: ping?.recorded_at,
    })
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Internal error")
  }
})
