-- Migration 0010: Location Tracking
--
-- Creates the location_pings table for GPS tracking of transport vehicles.
-- Data is written by the location-ping Edge Function (transporter app / driver).
-- Read by the routing service for ETA calculations and by the frontend for
-- real-time truck position display.

-- ─── location_pings ───
CREATE TABLE IF NOT EXISTS location_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  transporter_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  accuracy_m numeric,
  speed_kmh numeric,
  heading numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  device_info jsonb
);

-- Primary index: latest ping per order
CREATE INDEX IF NOT EXISTS idx_location_pings_order_latest
  ON location_pings (order_id, recorded_at DESC);

-- Secondary index: transporter's recent pings
CREATE INDEX IF NOT EXISTS idx_location_pings_transporter
  ON location_pings (transporter_user_id, recorded_at DESC)
  WHERE transporter_user_id IS NOT NULL;

-- Time-based index for cleanup / staleness queries
CREATE INDEX IF NOT EXISTS idx_location_pings_time
  ON location_pings (recorded_at);

-- ─── RLS ───
ALTER TABLE location_pings ENABLE ROW LEVEL SECURITY;

-- Transporters can insert their own pings
CREATE POLICY "Transporters can insert own pings"
  ON location_pings FOR INSERT
  WITH CHECK (transporter_user_id = auth.uid());

-- Order owners can read pings for their orders
CREATE POLICY "Order owners can read order pings"
  ON location_pings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM orders WHERE id = location_pings.order_id AND user_id = auth.uid())
    OR transporter_user_id = auth.uid()
    OR public.is_admin()
  );

-- ─── Staleness helper ───
-- View: latest ping per order (for quick lookup)
CREATE OR REPLACE VIEW latest_location_pings AS
SELECT DISTINCT ON (order_id)
  order_id,
  id,
  transporter_user_id,
  latitude,
  longitude,
  accuracy_m,
  speed_kmh,
  heading,
  recorded_at,
  device_info
FROM location_pings
ORDER BY order_id, recorded_at DESC;

-- ─── Cleanup function ───
-- Deletes pings older than 30 days (run via pg_cron or manual maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_location_pings()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted integer;
BEGIN
  WITH deleted AS (
    DELETE FROM location_pings
    WHERE recorded_at < now() - interval '30 days'
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM deleted;
  RETURN v_deleted;
END;
$$;

COMMENT ON TABLE location_pings IS 'GPS location pings from transporter devices for order tracking.';
COMMENT ON VIEW latest_location_pings IS 'Most recent location ping per order.';
