/**
 * WhatsApp Webhook Handler — spec Section 22.
 *
 * Pipeline:
 * 1. Verify signature (HMAC-SHA256)
 * 2. Validate payload structure
 * 3. Check idempotency (duplicate event detection)
 * 4. Persist raw event
 * 5. Normalize message
 * 6. Resolve user/conversation/order
 * 7. Persist inbound message
 * 8. Route to NegotiationAgent
 * 9. Produce structured action
 *
 * This is a skeleton — the real implementation requires:
 * - WHATSAPP_VERIFY_TOKEN for webhook verification
 * - WHATSAPP_APP_SECRET for HMAC signature validation
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

const jsonHeaders = { ...cors, "Content-Type": "application/json" };

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "freshroute_verify";
const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";

Deno.serve(async (req) => {
  // ─── Handle webhook verification (GET) ───
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
      return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
    }

    return new Response("Forbidden", { status: 403 });
  }

  // ─── Handle OPTIONS ───
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  // ─── Only accept POST ───
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: jsonHeaders });
  }

  try {
    const rawBody = await req.text();

    // ─── Step 1: Verify signature ───
    if (APP_SECRET) {
      const signature = req.headers.get("x-hub-signature-256");
      if (!signature) {
        return new Response(JSON.stringify({ ok: false, error: "Missing signature" }), {
          status: 401,
          headers: jsonHeaders,
        });
      }

      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(APP_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
      const expectedSig = "sha256=" + Array.from(new Uint8Array(sigBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (signature !== expectedSig) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid signature" }), {
          status: 401,
          headers: jsonHeaders,
        });
      }
    }

    // ─── Step 2: Validate payload structure ───
    const payload = JSON.parse(rawBody);
    if (payload.object !== "whatsapp_business_account") {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: jsonHeaders,
      });
    }

    // Create admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const admin = createClient(supabaseUrl, supabaseKey);

    // ─── Step 3-9: Process each entry ───
    const entries = payload.entry ?? [];
    const results: Array<{ processed: boolean; messageId?: string; error?: string }> = [];

    for (const entry of entries) {
      const changes = entry.changes ?? [];

      for (const change of changes) {
        if (change.field !== "messages") continue;

        const value = change.value ?? {};
        const messages = value.messages ?? [];
        const contacts = value.contacts ?? [];

        for (const message of messages) {
          try {
            const result = await processInboundMessage(admin, message, contacts, value);
            results.push(result);
          } catch (error) {
            results.push({
              processed: false,
              messageId: message.id,
              error: error instanceof Error ? error.message : "Processing failed",
            });
          }
        }

        // Process status updates (delivery receipts, read receipts)
        const statuses = value.statuses ?? [];
        for (const status of statuses) {
          await processStatusUpdate(admin, status);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Webhook processing failed",
      }),
      { status: 200, headers: jsonHeaders },
    );
  }
});

// ─── Process inbound message ────────────────────────────

async function processInboundMessage(
  admin: ReturnType<typeof createClient>,
  message: Record<string, unknown>,
  contacts: Array<Record<string, unknown>>,
  value: Record<string, unknown>,
): Promise<{ processed: boolean; messageId?: string; error?: string }> {
  const messageId = message.id as string;
  const from = message.from as string;
  const timestamp = message.timestamp as string;
  const messageType = message.type as string;

  // Step 3: Check idempotency
  const { data: existing } = await admin
    .from("messages")
    .select("id")
    .eq("provider_message_id", messageId)
    .maybeSingle();

  if (existing) {
    return { processed: false, messageId, error: "Duplicate event" };
  }

  // Step 5: Normalize message content
  let content = "";
  if (messageType === "text") {
    content = (message.text as Record<string, string>)?.body ?? "";
  } else if (messageType === "image") {
    content = "[Image received]";
  } else if (messageType === "audio") {
    content = "[Voice message received]";
  } else {
    content = `[${messageType} message]`;
  }

  // Step 6: Resolve user (match by phone number)
  const contact = contacts.find((c) => c.wa_id === from);
  const contactName = (contact?.profile as Record<string, string>)?.name ?? "Unknown";

  // Look up user by phone number in profiles
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", from)
    .maybeSingle();

  // Step 7: Persist inbound message
  const idempotencyKey = `inbound-${messageId}`;
  const { data: msgRecord, error: insertError } = await admin
    .from("messages")
    .insert({
      sender_user_id: profile?.id ?? null,
      recipient_user_id: profile?.id ?? null, // Self-referencing for inbound
      content,
      channel: "whatsapp_cloud",
      direction: "inbound",
      status: "delivered",
      provider_message_id: messageId,
      provider: "whatsapp_cloud",
      idempotency_key: idempotencyKey,
      rendered_body: content,
      sent_at: new Date(Number(timestamp) * 1000).toISOString(),
      delivered_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (insertError) {
    return { processed: false, messageId, error: insertError.message };
  }

  // Step 8: Route to NegotiationAgent (via agent session)
  // In production, this would trigger the agent to process the inbound message
  void admin.from("order_events").insert({
    order_id: "pending", // Would be resolved from conversation context
    event_type: "whatsapp_inbound",
    payload: {
      messageId,
      from,
      contactName,
      content,
      type: messageType,
    },
    source: "whatsapp_webhook",
    actor_type: "webhook",
  });

  return { processed: true, messageId };
}

// ─── Process status update (delivery/read receipts) ────

async function processStatusUpdate(
  admin: ReturnType<typeof createClient>,
  status: Record<string, unknown>,
): Promise<void> {
  const messageId = status.id as string;
  const newStatus = status.status as string;
  const timestamp = status.timestamp as string;

  if (!messageId) return;

  // Update the message record with delivery/read timestamps
  const updateFields: Record<string, unknown> = {};

  if (newStatus === "delivered") {
    updateFields.status = "delivered";
    updateFields.delivered_at = new Date(Number(timestamp) * 1000).toISOString();
  } else if (newStatus === "read") {
    updateFields.status = "read";
    updateFields.read_at = new Date(Number(timestamp) * 1000).toISOString();
  } else if (newStatus === "failed") {
    updateFields.status = "failed";
    updateFields.failure_reason = (status.errors as Array<Record<string, string>>)?.[0]?.title ?? "Unknown failure";
  }

  if (Object.keys(updateFields).length > 0) {
    await admin
      .from("messages")
      .update(updateFields)
      .eq("provider_message_id", messageId);
  }
}
