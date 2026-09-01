-- Migration 0014: Enhanced Messages Table
-- Per spec Section 20: full messaging metadata for WhatsApp integration

-- ─── Add columns to existing messages table ───
ALTER TABLE messages ADD COLUMN IF NOT EXISTS direction text
  CHECK (direction IN ('outbound', 'inbound'));

ALTER TABLE messages ADD COLUMN IF NOT EXISTS template_name text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS template_version text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS rendered_body text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS provider_message_id text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS failure_reason text;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS order_id text REFERENCES orders(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS offer_id text REFERENCES offers(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS approval_id text;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at timestamptz;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS idempotency_key text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'simulated';

-- Unique idempotency key constraint (prevent duplicate sends)
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_idempotency
  ON messages (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Index for order-related message lookups
CREATE INDEX IF NOT EXISTS idx_messages_order ON messages (order_id, created_at DESC)
  WHERE order_id IS NOT NULL;

-- Index for offer-related message lookups
CREATE INDEX IF NOT EXISTS idx_messages_offer ON messages (offer_id, created_at DESC)
  WHERE offer_id IS NOT NULL;

-- Index for provider message deduplication
CREATE INDEX IF NOT EXISTS idx_messages_provider_id ON messages (provider_message_id)
  WHERE provider_message_id IS NOT NULL;

-- ─── Backfill direction for existing messages ───
UPDATE messages
SET direction = 'outbound'
WHERE direction IS NULL;

-- ─── Expand status check constraint ───
-- Drop old constraint and add expanded one
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE messages ADD CONSTRAINT messages_status_check
  CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed', 'rejected'));

-- ─── Expand channel check constraint ───
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_channel_check;
ALTER TABLE messages ADD CONSTRAINT messages_channel_check
  CHECK (channel IN ('whatsapp', 'whatsapp_cloud', 'sms', 'in_app', 'simulated'));
