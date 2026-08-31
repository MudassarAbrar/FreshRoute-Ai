-- FreshRoute — seed real provider accounts (Phase 2)
-- Creates buyer, transporter, and storage provider accounts
-- using profiles + user_roles + role_profiles.

-- ─── Expand profiles.role constraint to support all role types ───
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('farmer', 'buyer', 'transporter', 'storage_provider', 'admin'));

-- ─── Deterministic UUIDs for seeded providers ───
-- Buyers
\set b1 'a1000001-0000-4000-a000-000000000001'
\set b2 'a1000001-0000-4000-a000-000000000002'
\set b3 'a1000001-0000-4000-a000-000000000003'
\set b4 'a1000001-0000-4000-a000-000000000004'
-- Transporters
\set t1 'a1000002-0000-4000-a000-000000000001'
\set t2 'a1000002-0000-4000-a000-000000000002'
\set t3 'a1000002-0000-4000-a000-000000000003'
-- Storage
\set s1 'a1000003-0000-4000-a000-000000000001'

-- ─── Insert profiles ───
insert into public.profiles (id, full_name, email, city, role, source) values
  (:'b1', 'Al-Karam Wholesale Co.',   'alkaram@freshroute.seed',   'Lahore',      'buyer',             'seed'),
  (:'b2', 'Metro Fresh Retail',       'metrofresh@freshroute.seed','Lahore',      'buyer',             'seed'),
  (:'b3', 'Chenab Traders',           'chenab@freshroute.seed',    'Faisalabad',  'buyer',             'seed'),
  (:'b4', 'Empress Market Dealer',    'empress@freshroute.seed',   'Karachi',     'buyer',             'seed'),
  (:'t1', 'Malik Transport',          'malik@freshroute.seed',     'Multan',      'transporter',       'seed'),
  (:'t2', 'Rana Goods Carrier',       'rana@freshroute.seed',      'Multan',      'transporter',       'seed'),
  (:'t3', 'RapidCold Logistics',      'rapidcold@freshroute.seed', 'Lahore',      'transporter',       'seed'),
  (:'s1', 'Multan Cold Hub',          'coldhub@freshroute.seed',   'Multan',      'storage_provider',  'seed')
on conflict (id) do nothing;

-- ─── Insert user_roles ───
insert into public.user_roles (id, user_id, role, status) values
  (gen_random_uuid(), :'b1', 'buyer',             'active'),
  (gen_random_uuid(), :'b2', 'buyer',             'active'),
  (gen_random_uuid(), :'b3', 'buyer',             'active'),
  (gen_random_uuid(), :'b4', 'buyer',             'active'),
  (gen_random_uuid(), :'t1', 'transporter',       'active'),
  (gen_random_uuid(), :'t2', 'transporter',       'active'),
  (gen_random_uuid(), :'t3', 'transporter',       'active'),
  (gen_random_uuid(), :'s1', 'storage_provider',  'active');

-- ─── Insert role_profiles ───

-- Buyer profiles
insert into public.role_profiles (user_role_id, profile_json)
select ur.id, profile_data.json
from public.user_roles ur
cross join (values
  (:'b1'::uuid, '{"orgName":"Al-Karam Wholesale Co.","typicalCommodities":["Tomato","Potato","Onion","Okra"],"deliveryRegions":["Lahore"],"priceCeiling":100,"acceptanceRate":82,"rejectionPct":0.04,"paymentTerms":"2-3 days","minKg":200,"maxKg":5000,"verified":true}'::jsonb),
  (:'b2'::uuid, '{"orgName":"Metro Fresh Retail","typicalCommodities":["Tomato","Mango","Banana","Green Chili"],"deliveryRegions":["Lahore","Islamabad"],"priceCeiling":120,"acceptanceRate":65,"rejectionPct":0.18,"paymentTerms":"7 days","minKg":300,"maxKg":3000,"verified":true}'::jsonb),
  (:'b3'::uuid, '{"orgName":"Chenab Traders","typicalCommodities":["Tomato","Potato","Onion","Kinnow"],"deliveryRegions":["Faisalabad","Lahore"],"priceCeiling":95,"acceptanceRate":78,"rejectionPct":0.05,"paymentTerms":"3-4 days","minKg":150,"maxKg":4000,"verified":true}'::jsonb),
  (:'b4'::uuid, '{"orgName":"Empress Market Dealer","typicalCommodities":["Tomato","Potato","Onion","Mango","Banana","Green Chili","Okra"],"deliveryRegions":["Karachi"],"priceCeiling":110,"acceptanceRate":80,"rejectionPct":0.04,"paymentTerms":"on delivery","minKg":500,"maxKg":10000,"verified":true}'::jsonb)
) as profile_data(user_id, json)
where ur.user_id = profile_data.user_id and ur.role = 'buyer';

-- Transporter profiles
insert into public.role_profiles (user_role_id, profile_json)
select ur.id, profile_data.json
from public.user_roles ur
cross join (values
  (:'t1'::uuid, '{"vehicleType":"Open Mazda · 1.5 t","capacityKg":1500,"refrigerated":false,"serviceArea":["Multan","Faisalabad","Lahore"],"ratePerKm":26,"onTimePct":78}'::jsonb),
  (:'t2'::uuid, '{"vehicleType":"Covered Mazda · 2 t","capacityKg":2000,"refrigerated":false,"serviceArea":["Multan","Lahore","Islamabad","Faisalabad"],"ratePerKm":31,"onTimePct":85}'::jsonb),
  (:'t3'::uuid, '{"vehicleType":"Refrigerated Shehzore · 1 t","capacityKg":1000,"refrigerated":true,"serviceArea":["Multan","Lahore","Islamabad","Karachi","Faisalabad"],"ratePerKm":47,"onTimePct":92}'::jsonb)
) as profile_data(user_id, json)
where ur.user_id = profile_data.user_id and ur.role = 'transporter';

-- Storage provider profiles
insert into public.role_profiles (user_role_id, profile_json)
select ur.id, profile_data.json
from public.user_roles ur
cross join (values
  (:'s1'::uuid, '{"facilityType":"cold_storage","capacityUnits":5000,"tempRange":{"min":2,"max":8},"city":"Multan","perKgPerDay":3.5,"verified":true}'::jsonb)
) as profile_data(user_id, json)
where ur.user_id = profile_data.user_id and ur.role = 'storage_provider';

-- ─── Add read policy for active providers ───
-- Allow any authenticated user to read active provider profiles
-- (needed for buyer/transporter/storage matching)
create policy "role_profiles: read active providers"
  on public.role_profiles for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.id = role_profiles.user_role_id
        and ur.status = 'active'
        and ur.role in ('buyer', 'transporter', 'storage_provider')
    )
  );

-- Also allow reading all active user_roles for provider matching
create policy "user_roles: read active providers"
  on public.user_roles for select
  using (
    status = 'active'
    and role in ('buyer', 'transporter', 'storage_provider')
  );
