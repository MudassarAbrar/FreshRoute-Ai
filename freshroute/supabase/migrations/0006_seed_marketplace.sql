-- Migration: Seed Marketplace Demo Data (Task 3)
-- Demo buyers, transporters, storage providers, listings, and offers

-- ─── Seed buyer role profiles ───
-- Assumes demo user 'demo-farmer-uid' exists from 0002_seed.sql
-- We add buyer, transporter, storage provider roles for demo purposes

INSERT INTO user_roles (user_id, role, status)
SELECT 'demo-farmer-uid', 'buyer', 'active'
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 'demo-farmer-uid' AND role = 'buyer');

INSERT INTO user_roles (user_id, role, status)
SELECT 'demo-farmer-uid', 'transporter', 'active'
WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = 'demo-farmer-uid' AND role = 'transporter');

-- ─── Seed listings ───
INSERT INTO listings (id, owner_user_id, listing_type, commodity, quantity, unit, location_geo, price, status, attributes)
VALUES
  ('listing-lot-001', 'demo-farmer-uid', 'lot', 'Tomato', 800, 'kg', 'Multan', 62, 'active',
   '{"grade": "B", "harvestDate": "2026-08-20", "packaging": "crates"}'),
  ('listing-lot-002', 'demo-farmer-uid', 'lot', 'Potato', 1500, 'kg', 'Lahore', 55, 'active',
   '{"grade": "A", "harvestDate": "2026-08-18", "packaging": "sacks"}'),
  ('listing-lot-003', 'demo-farmer-uid', 'lot', 'Mango', 400, 'kg', 'Multan', 120, 'active',
   '{"grade": "A", "harvestDate": "2026-08-15", "packaging": "crates"}')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed buyer_request listings ───
INSERT INTO listings (id, owner_user_id, listing_type, commodity, quantity, unit, location_geo, price, status, attributes)
VALUES
  ('listing-br-001', 'demo-farmer-uid', 'buyer_request', 'Tomato', 500, 'kg', 'Lahore', 100, 'active',
   '{"grade": "B", "deliveryRegion": "Lahore", "priceCeiling": 100, "neededBy": "2026-08-25"}'),
  ('listing-br-002', 'demo-farmer-uid', 'buyer_request', 'Onion', 1000, 'kg', 'Faisalabad', 60, 'active',
   '{"grade": "any", "deliveryRegion": "Faisalabad", "priceCeiling": 60, "neededBy": "2026-08-28"}')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed transport_slot listings ───
INSERT INTO listings (id, owner_user_id, listing_type, commodity, quantity, unit, location_geo, price, status, attributes)
VALUES
  ('listing-ts-001', 'demo-farmer-uid', 'transport_slot', 'General', 2000, 'kg', 'Multan-Lahore', 31, 'active',
   '{"vehicleType": "Covered Mazda", "refrigerated": false, "availableDate": "2026-08-22"}')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed storage_slot listings ───
INSERT INTO listings (id, owner_user_id, listing_type, commodity, quantity, unit, location_geo, price, status, attributes)
VALUES
  ('listing-ss-001', 'demo-farmer-uid', 'storage_slot', 'General', 5000, 'units', 'Multan', 3.5, 'active',
   '{"facilityType": "cold_storage", "tempRange": {"min": 2, "max": 8}, "certifications": ["ISO 22000"]}')
ON CONFLICT (id) DO NOTHING;

-- ─── Seed sample offers ───
INSERT INTO offers (listing_id, offering_user_id, price, quantity, message, status)
VALUES
  ('listing-lot-001', 'demo-farmer-uid', 92, 800, 'Interested in the full lot for Lahore market', 'pending'),
  ('listing-lot-002', 'demo-farmer-uid', 60, 1000, 'Can take 1000 kg at this rate', 'pending')
ON CONFLICT DO NOTHING;

-- ─── Seed sample order events ───
INSERT INTO order_events (order_id, event_type, payload)
SELECT 'FR-2000', 'ORDER_CREATED', '{"source": "seed", "note": "demo order event"}'
WHERE EXISTS (SELECT 1 FROM orders WHERE id = 'FR-2000');
