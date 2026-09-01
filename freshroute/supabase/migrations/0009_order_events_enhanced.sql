-- Migration 0009: Enhanced order_events + order status state machine enforcement
--
-- Goals:
-- 1. Expand orders.status to support all 14 state machine states
-- 2. Add structured columns to order_events for audit trail (spec Section 27)
-- 3. Create trigger to prevent direct orders.status writes outside the state machine
-- 4. Create transition_order() stored procedure as the authorized transition path

-- ─────────────────────────────────────────────────────────────────
-- 1. Expand orders.status check constraint to 14 state machine states
-- ─────────────────────────────────────────────────────────────────

-- Drop old check constraint and add new one
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'LISTED', 'OFFER_RECEIVED', 'OFFER_ACCEPTED',
    'TRANSPORT_PENDING', 'TRANSPORT_BOOKED',
    'STORAGE_PENDING', 'STORAGE_BOOKED',
    'IN_TRANSIT', 'DELIVERED',
    'PAYMENT_PENDING', 'PAID', 'CLOSED',
    'CANCELLED', 'DISPUTED'
  ));

-- Migrate existing data: 'active' → 'LISTED', 'completed' → 'CLOSED', 'cancelled' → 'CANCELLED'
UPDATE orders SET status = 'LISTED' WHERE status = 'active';
UPDATE orders SET status = 'CLOSED' WHERE status = 'completed';
UPDATE orders SET status = 'CANCELLED' WHERE status = 'cancelled';

-- Update default to initial state machine state
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'LISTED';

-- ─────────────────────────────────────────────────────────────────
-- 2. Add internal column for state machine authorization
--    This column is set by transition_order() and checked by the trigger.
--    It is dropped immediately after use within the trigger.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS _transition_source text DEFAULT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 3. Enhance order_events table (spec Section 27)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE order_events ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS actor_type text;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS actor_id text;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS previous_state text;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS new_state text;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS correlation_id text;
ALTER TABLE order_events ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Unique idempotency key (partial index — only where not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_events_idempotency
  ON order_events (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Index for event source queries
CREATE INDEX IF NOT EXISTS idx_order_events_source
  ON order_events (source, created_at DESC)
  WHERE source IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 4. Trigger: prevent direct orders.status writes outside state machine
--
-- The trigger fires BEFORE UPDATE on orders and rejects any status
-- change that doesn't have _transition_source = 'state_machine'.
-- This enforces that ALL status changes go through transition_order()
-- or the shared transitionOrder() function.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION enforce_order_state_machine()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check when status is actually changing
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Allow if the transition is authorized via the state machine path
    IF NEW._transition_source = 'state_machine' THEN
      -- Clear the flag so it doesn't persist
      NEW._transition_source := NULL;
      RETURN NEW;
    END IF;

    -- Reject unauthorized status changes
    RAISE EXCEPTION
      'Direct order status update blocked: % → %. Use transition_order() or transitionOrder() to change order status.',
      OLD.status, NEW.status
      USING ERRCODE = 'P0001';
  END IF;

  -- Status not changing — allow the update
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_order_state_machine ON orders;
CREATE TRIGGER trg_enforce_order_state_machine
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION enforce_order_state_machine();

-- ─────────────────────────────────────────────────────────────────
-- 5. Stored procedure: transition_order()
--
-- Server-side authorized transition path. Can be called via RPC
-- as an alternative to the TypeScript transitionOrder() function.
-- Sets _transition_source so the trigger allows the update.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION transition_order(
  p_order_id text,
  p_new_status text,
  p_source text DEFAULT 'system',
  p_actor_type text DEFAULT 'system',
  p_actor_id text DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_status text;
  v_valid_transitions jsonb;
BEGIN
  -- Valid transitions lookup
  v_valid_transitions := jsonb_build_object(
    'LISTED',            '["OFFER_RECEIVED","CANCELLED"]'::jsonb,
    'OFFER_RECEIVED',    '["OFFER_ACCEPTED","CANCELLED"]'::jsonb,
    'OFFER_ACCEPTED',    '["TRANSPORT_PENDING","STORAGE_PENDING","CANCELLED"]'::jsonb,
    'TRANSPORT_PENDING', '["TRANSPORT_BOOKED","CANCELLED"]'::jsonb,
    'TRANSPORT_BOOKED',  '["IN_TRANSIT","STORAGE_PENDING","CANCELLED"]'::jsonb,
    'STORAGE_PENDING',   '["STORAGE_BOOKED","TRANSPORT_PENDING","CANCELLED"]'::jsonb,
    'STORAGE_BOOKED',    '["TRANSPORT_PENDING","IN_TRANSIT","CANCELLED"]'::jsonb,
    'IN_TRANSIT',        '["DELIVERED","DISPUTED"]'::jsonb,
    'DELIVERED',         '["PAYMENT_PENDING","PAID","DISPUTED"]'::jsonb,
    'PAYMENT_PENDING',   '["PAID","DISPUTED"]'::jsonb,
    'PAID',              '["CLOSED"]'::jsonb,
    'CLOSED',            '[]'::jsonb,
    'CANCELLED',         '[]'::jsonb,
    'DISPUTED',          '["CANCELLED","CLOSED"]'::jsonb
  );

  -- Fetch current status
  SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id USING ERRCODE = 'P0002';
  END IF;

  -- Validate transition
  IF NOT (v_valid_transitions->v_old_status)::jsonb @> to_jsonb(p_new_status::text) THEN
    RAISE EXCEPTION 'Invalid order transition: % → %', v_old_status, p_new_status
      USING ERRCODE = 'P0003';
  END IF;

  -- Authorized update (trigger will see _transition_source = 'state_machine')
  UPDATE orders
  SET status = p_new_status, _transition_source = 'state_machine'
  WHERE id = p_order_id;

  -- Audit event
  INSERT INTO order_events (order_id, event_type, source, actor_type, actor_id, previous_state, new_state, payload)
  VALUES (
    p_order_id,
    'STATUS_' || v_old_status || '_TO_' || p_new_status,
    p_source,
    p_actor_type,
    p_actor_id,
    v_old_status,
    p_new_status,
    jsonb_build_object('from', v_old_status, 'to', p_new_status) || p_payload
  );

  RETURN jsonb_build_object(
    'ok', true,
    'orderId', p_order_id,
    'previousStatus', v_old_status,
    'newStatus', p_new_status
  );
END;
$$;

-- Grant execute to service_role (Edge Functions use service role key)
-- Authenticated users can call via RPC if needed
COMMENT ON FUNCTION transition_order IS 'Authorized order status transition with state machine validation and audit logging.';
