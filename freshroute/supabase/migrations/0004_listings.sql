-- Migration: Unified Listings Model (Task 2)
-- Single listings table with listing_type enum and JSONB attributes

-- ─── listings ───
CREATE TABLE IF NOT EXISTS listings (
  id text PRIMARY KEY,
  owner_user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_type text NOT NULL CHECK (listing_type IN ('lot', 'storage_slot', 'transport_slot', 'buyer_request')),
  commodity text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'kg',
  location_geo text NOT NULL DEFAULT '',
  price numeric,
  available_from timestamptz,
  available_to timestamptz,
  attributes jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_listings_type_commodity_status
  ON listings (listing_type, commodity, status);
CREATE INDEX IF NOT EXISTS idx_listings_owner_created
  ON listings (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_status
  ON listings (status);

-- RLS: read all active; insert/update own; admin read all
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active listings"
  ON listings FOR SELECT
  USING (status = 'active' OR owner_user_id = auth.uid());

CREATE POLICY "Users can insert own listings"
  ON listings FOR INSERT
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update own listings"
  ON listings FOR UPDATE
  USING (owner_user_id = auth.uid());

-- Admin full access (assumes admin check via profiles.role)
CREATE POLICY "Admins can read all listings"
  ON listings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
