-- Migration 0012: Typed Marketplace Tables
-- Replaces hardcoded market.ts arrays with queryable, relational data.
-- These tables complement the existing role_profiles JSONB approach
-- where relational querying is needed.

-- ─── buyer_preferences ───
-- Structured buyer preferences for matching
CREATE TABLE IF NOT EXISTS buyer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  commodity text NOT NULL,
  min_grade text,
  max_grade text,
  min_kg numeric NOT NULL DEFAULT 0,
  max_kg numeric NOT NULL DEFAULT 999999,
  price_ceiling numeric,
  delivery_regions text[] NOT NULL DEFAULT '{}',
  payment_terms text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_buyer_prefs_commodity ON buyer_preferences (commodity)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_buyer_prefs_user ON buyer_preferences (buyer_user_id);

ALTER TABLE buyer_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers manage own preferences"
  ON buyer_preferences FOR ALL
  USING (buyer_user_id = auth.uid())
  WITH CHECK (buyer_user_id = auth.uid());
CREATE POLICY "Sellers can read active buyer preferences"
  ON buyer_preferences FOR SELECT
  USING (is_active = true);

-- ─── transporter_capabilities ───
-- Structured transporter details for matching
CREATE TABLE IF NOT EXISTS transporter_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_type text NOT NULL,
  capacity_kg numeric NOT NULL,
  refrigerated boolean NOT NULL DEFAULT false,
  rate_per_km numeric NOT NULL DEFAULT 30,
  service_radius_km numeric NOT NULL DEFAULT 500,
  on_time_pct numeric NOT NULL DEFAULT 75 CHECK (on_time_pct >= 0 AND on_time_pct <= 100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transporter_caps_active ON transporter_capabilities (is_active, refrigerated)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_transporter_caps_user ON transporter_capabilities (transporter_user_id);

ALTER TABLE transporter_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transporters manage own capabilities"
  ON transporter_capabilities FOR ALL
  USING (transporter_user_id = auth.uid())
  WITH CHECK (transporter_user_id = auth.uid());
CREATE POLICY "Users can read active transporter capabilities"
  ON transporter_capabilities FOR SELECT
  USING (is_active = true);

-- ─── storage_facility_details ───
-- Structured storage provider details
CREATE TABLE IF NOT EXISTS storage_facility_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  facility_name text NOT NULL,
  city text NOT NULL,
  temp_min_c numeric,
  temp_max_c numeric,
  per_kg_per_day numeric NOT NULL DEFAULT 3.5,
  total_capacity_kg numeric NOT NULL DEFAULT 10000,
  verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_storage_facility_city ON storage_facility_details (city)
  WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_storage_facility_user ON storage_facility_details (provider_user_id);

ALTER TABLE storage_facility_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Providers manage own facilities"
  ON storage_facility_details FOR ALL
  USING (provider_user_id = auth.uid())
  WITH CHECK (provider_user_id = auth.uid());
CREATE POLICY "Users can read active storage facilities"
  ON storage_facility_details FOR SELECT
  USING (is_active = true);

-- ─── vendor_availability ───
-- Day-level availability for all vendor roles
CREATE TABLE IF NOT EXISTS vendor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  available boolean NOT NULL DEFAULT true,
  remaining_capacity_kg numeric,
  blackout_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_vendor_avail_date ON vendor_availability (date)
  WHERE available = true;

ALTER TABLE vendor_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendors manage own availability"
  ON vendor_availability FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can read vendor availability"
  ON vendor_availability FOR SELECT
  USING (true);

-- ─── vendor_ratings ───
-- Trust/reputation system
CREATE TABLE IF NOT EXISTS vendor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rater_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  order_id text REFERENCES orders(id),
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_ratings_user ON vendor_ratings (user_id, created_at DESC);

ALTER TABLE vendor_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read vendor ratings"
  ON vendor_ratings FOR SELECT
  USING (true);
CREATE POLICY "Users can create ratings for completed orders"
  ON vendor_ratings FOR INSERT
  WITH CHECK (rater_user_id = auth.uid());

-- ─── price_observations ───
-- Real market price data (replaces CROP_PRICES from market.ts)
CREATE TABLE IF NOT EXISTS price_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crop text NOT NULL,
  city text NOT NULL,
  price_per_kg numeric NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  source text NOT NULL DEFAULT 'seed',
  observed_at timestamptz NOT NULL DEFAULT now(),
  retrieved_at timestamptz NOT NULL DEFAULT now(),
  confidence numeric NOT NULL DEFAULT 0.8 CHECK (confidence >= 0 AND confidence <= 1),
  source_reference text,
  is_demo boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_price_obs_crop_city ON price_observations (crop, city, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_obs_recent ON price_observations (observed_at DESC);

ALTER TABLE price_observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read price observations"
  ON price_observations FOR SELECT
  USING (true);
CREATE POLICY "System can insert price observations"
  ON price_observations FOR INSERT
  WITH CHECK (true);

-- ─── crop_reference_data ───
-- Crop aliases, volatility, perishability (replaces CROP_ALIASES, CROP_VOLATILITY, PERISHABILITY_PROFILES)
CREATE TABLE IF NOT EXISTS crop_reference_data (
  crop_name text PRIMARY KEY,
  aliases text[] NOT NULL DEFAULT '{}',
  volatility numeric NOT NULL DEFAULT 0.8,
  decay_rate_per_hour numeric NOT NULL DEFAULT 0.005,
  ideal_temp_min_c numeric NOT NULL DEFAULT 5,
  ideal_temp_max_c numeric NOT NULL DEFAULT 15,
  ideal_humidity_min numeric NOT NULL DEFAULT 85,
  ideal_humidity_max numeric NOT NULL DEFAULT 95
);

ALTER TABLE crop_reference_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read crop reference data"
  ON crop_reference_data FOR SELECT
  USING (true);
CREATE POLICY "System can manage crop reference data"
  ON crop_reference_data FOR ALL
  USING (true)
  WITH CHECK (true);
