-- Migration: Marketplace Tables Consolidation (Task 3)
-- Remaining tables needed by the marketplace: offers, events, bookings, spoilage, etc.

-- ─── offers ───
CREATE TABLE IF NOT EXISTS offers (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  offering_user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  quantity numeric NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_offers_listing ON offers (listing_id, created_at DESC);
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read offers on own listings" ON offers FOR SELECT USING (
  EXISTS (SELECT 1 FROM listings WHERE id = offers.listing_id AND owner_user_id = auth.uid())
  OR offering_user_id = auth.uid()
);
CREATE POLICY "Users can create offers" ON offers FOR INSERT WITH CHECK (offering_user_id = auth.uid());

-- ─── order_events (audit trail) ───
CREATE TABLE IF NOT EXISTS order_events (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events (order_id, created_at);
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own order events" ON order_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_events.order_id AND user_id = auth.uid())
);
CREATE POLICY "System can insert order events" ON order_events FOR INSERT WITH CHECK (true);

-- ─── spoilage_assessments ───
CREATE TABLE IF NOT EXISTS spoilage_assessments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  computed_at timestamptz NOT NULL DEFAULT now(),
  risk_score text NOT NULL,
  est_loss_pct numeric NOT NULL DEFAULT 0,
  factors jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_spoilage_listing ON spoilage_assessments (listing_id, computed_at DESC);
ALTER TABLE spoilage_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own spoilage assessments" ON spoilage_assessments FOR SELECT USING (
  EXISTS (SELECT 1 FROM listings WHERE id = spoilage_assessments.listing_id AND owner_user_id = auth.uid())
);
CREATE POLICY "Users can insert own spoilage assessments" ON spoilage_assessments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = spoilage_assessments.listing_id AND owner_user_id = auth.uid())
);

-- ─── recommendations ───
CREATE TABLE IF NOT EXISTS recommendations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id text NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  generated_at timestamptz NOT NULL DEFAULT now(),
  options jsonb NOT NULL DEFAULT '[]',
  chosen_option text,
  status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'accepted', 'expired'))
);
CREATE INDEX IF NOT EXISTS idx_recommendations_listing ON recommendations (listing_id, generated_at DESC);
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own recommendations" ON recommendations FOR SELECT USING (
  EXISTS (SELECT 1 FROM listings WHERE id = recommendations.listing_id AND owner_user_id = auth.uid())
);
CREATE POLICY "Users can insert own recommendations" ON recommendations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = recommendations.listing_id AND owner_user_id = auth.uid())
);

-- ─── transport_bookings ───
CREATE TABLE IF NOT EXISTS transport_bookings (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  transporter_user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pickup_window text NOT NULL DEFAULT '',
  dropoff_window text NOT NULL DEFAULT '',
  rate numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_transit', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_order ON transport_bookings (order_id);
ALTER TABLE transport_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transport bookings" ON transport_bookings FOR SELECT USING (
  transporter_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM orders WHERE id = transport_bookings.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create transport bookings" ON transport_bookings FOR INSERT WITH CHECK (true);

-- ─── storage_bookings ───
CREATE TABLE IF NOT EXISTS storage_bookings (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  order_id_or_lot_id text NOT NULL,
  storage_user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date text NOT NULL DEFAULT '',
  end_date text NOT NULL DEFAULT '',
  rate numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_storage_bookings_user ON storage_bookings (storage_user_id);
ALTER TABLE storage_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own storage bookings" ON storage_bookings FOR SELECT USING (
  storage_user_id = auth.uid()
);
CREATE POLICY "Users can create storage bookings" ON storage_bookings FOR INSERT WITH CHECK (true);

-- ─── agent_action_log ───
CREATE TABLE IF NOT EXISTS agent_action_log (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_run_id text NOT NULL,
  action_type text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}',
  output jsonb NOT NULL DEFAULT '{}',
  requires_approval boolean NOT NULL DEFAULT false,
  approved_by text,
  approved_at timestamptz,
  executed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'skipped'))
);
CREATE INDEX IF NOT EXISTS idx_agent_action_run ON agent_action_log (agent_run_id, executed_at);
CREATE INDEX IF NOT EXISTS idx_agent_action_status ON agent_action_log (status);
ALTER TABLE agent_action_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own agent actions" ON agent_action_log FOR SELECT USING (true);
CREATE POLICY "System can insert agent actions" ON agent_action_log FOR INSERT WITH CHECK (true);

-- ─── Expand orders table with FK columns ───
ALTER TABLE orders ADD COLUMN IF NOT EXISTS offer_id text REFERENCES offers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transport_booking_id text REFERENCES transport_bookings(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS storage_booking_id text REFERENCES storage_bookings(id);
