-- Migration 0013: Seed Marketplace Data from market.ts
-- All records marked source='seed' and is_demo=true.
-- These are NOT a production fallback — they are starting reference data.

-- ─── Seed crop reference data ───
INSERT INTO crop_reference_data (crop_name, aliases, volatility, decay_rate_per_hour, ideal_temp_min_c, ideal_temp_max_c, ideal_humidity_min, ideal_humidity_max) VALUES
('Tomato', ARRAY['tomato','tomatoes','tamatar','ٹماٹر'], 1.0, 0.008, 10, 15, 85, 95),
('Potato', ARRAY['potato','potatoes','aloo','آلو'], 0.25, 0.002, 7, 10, 90, 95),
('Onion', ARRAY['onion','onions','pyaaz','پیاز'], 0.3, 0.003, 0, 5, 65, 75),
('Mango', ARRAY['mango','mangoes','aam','آم'], 0.85, 0.006, 10, 13, 85, 90),
('Kinnow', ARRAY['kinnow'], 0.4, 0.003, 5, 8, 85, 90),
('Banana', ARRAY['banana','bananas'], 1.1, 0.009, 13, 15, 85, 95),
('Green Chili', ARRAY['chili','chilli','green chili','green chilli','mirch'], 0.9, 0.007, 7, 10, 85, 90),
('Okra', ARRAY['okra','bhindi','بھنڈی'], 0.95, 0.008, 7, 10, 85, 90),
('Leafy Vegetables', ARRAY['leafy','spinach','palak'], 1.6, 0.012, 0, 4, 95, 100)
ON CONFLICT (crop_name) DO NOTHING;

-- ─── Seed price observations (from CROP_PRICES) ───
INSERT INTO price_observations (crop, city, price_per_kg, unit, source, observed_at, confidence, is_demo) VALUES
-- Tomato
('Tomato', 'Multan', 62, 'kg', 'seed', now(), 0.8, true),
('Tomato', 'Lahore', 96, 'kg', 'seed', now(), 0.8, true),
('Tomato', 'Faisalabad', 70, 'kg', 'seed', now(), 0.8, true),
('Tomato', 'Islamabad', 84, 'kg', 'seed', now(), 0.8, true),
('Tomato', 'Karachi', 105, 'kg', 'seed', now(), 0.8, true),
-- Potato
('Potato', 'Multan', 55, 'kg', 'seed', now(), 0.8, true),
('Potato', 'Lahore', 65, 'kg', 'seed', now(), 0.8, true),
('Potato', 'Faisalabad', 58, 'kg', 'seed', now(), 0.8, true),
('Potato', 'Islamabad', 63, 'kg', 'seed', now(), 0.8, true),
('Potato', 'Karachi', 75, 'kg', 'seed', now(), 0.8, true),
-- Onion
('Onion', 'Multan', 48, 'kg', 'seed', now(), 0.8, true),
('Onion', 'Lahore', 58, 'kg', 'seed', now(), 0.8, true),
('Onion', 'Faisalabad', 52, 'kg', 'seed', now(), 0.8, true),
('Onion', 'Islamabad', 56, 'kg', 'seed', now(), 0.8, true),
('Onion', 'Karachi', 68, 'kg', 'seed', now(), 0.8, true),
-- Mango
('Mango', 'Multan', 120, 'kg', 'seed', now(), 0.8, true),
('Mango', 'Lahore', 145, 'kg', 'seed', now(), 0.8, true),
('Mango', 'Faisalabad', 128, 'kg', 'seed', now(), 0.8, true),
('Mango', 'Islamabad', 138, 'kg', 'seed', now(), 0.8, true),
('Mango', 'Karachi', 168, 'kg', 'seed', now(), 0.8, true),
-- Kinnow
('Kinnow', 'Multan', 85, 'kg', 'seed', now(), 0.8, true),
('Kinnow', 'Lahore', 105, 'kg', 'seed', now(), 0.8, true),
('Kinnow', 'Faisalabad', 90, 'kg', 'seed', now(), 0.8, true),
('Kinnow', 'Islamabad', 98, 'kg', 'seed', now(), 0.8, true),
('Kinnow', 'Karachi', 120, 'kg', 'seed', now(), 0.8, true),
-- Banana
('Banana', 'Multan', 110, 'kg', 'seed', now(), 0.8, true),
('Banana', 'Lahore', 130, 'kg', 'seed', now(), 0.8, true),
('Banana', 'Faisalabad', 118, 'kg', 'seed', now(), 0.8, true),
('Banana', 'Islamabad', 125, 'kg', 'seed', now(), 0.8, true),
('Banana', 'Karachi', 145, 'kg', 'seed', now(), 0.8, true),
-- Green Chili
('Green Chili', 'Multan', 140, 'kg', 'seed', now(), 0.8, true),
('Green Chili', 'Lahore', 175, 'kg', 'seed', now(), 0.8, true),
('Green Chili', 'Faisalabad', 155, 'kg', 'seed', now(), 0.8, true),
('Green Chili', 'Islamabad', 168, 'kg', 'seed', now(), 0.8, true),
('Green Chili', 'Karachi', 210, 'kg', 'seed', now(), 0.8, true),
-- Okra
('Okra', 'Multan', 95, 'kg', 'seed', now(), 0.8, true),
('Okra', 'Lahore', 118, 'kg', 'seed', now(), 0.8, true),
('Okra', 'Faisalabad', 104, 'kg', 'seed', now(), 0.8, true),
('Okra', 'Islamabad', 112, 'kg', 'seed', now(), 0.8, true),
('Okra', 'Karachi', 138, 'kg', 'seed', now(), 0.8, true),
-- Leafy Vegetables
('Leafy Vegetables', 'Multan', 60, 'kg', 'seed', now(), 0.8, true),
('Leafy Vegetables', 'Lahore', 78, 'kg', 'seed', now(), 0.8, true),
('Leafy Vegetables', 'Faisalabad', 66, 'kg', 'seed', now(), 0.8, true),
('Leafy Vegetables', 'Islamabad', 74, 'kg', 'seed', now(), 0.8, true),
('Leafy Vegetables', 'Karachi', 92, 'kg', 'seed', now(), 0.8, true);

-- ─── Seed city distances (reference data for routing fallback) ───
-- Stored as a simple reference — OSRM is used in production.
-- This is not a table but we note it for the marketplace service.
