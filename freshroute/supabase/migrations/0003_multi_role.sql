-- FreshRoute — multi-role support (Task 1)
-- Adds user_roles (M2M) and role_profiles tables.
-- A single user can hold multiple roles (e.g. farmer + transporter).

-- ─────────────────────────────── user_roles ───────────────────────────────

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('farmer', 'buyer', 'transporter', 'storage_provider')),
  status text not null default 'active' check (status in ('active', 'pending', 'disabled')),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index user_roles_user_idx on public.user_roles (user_id);
create index user_roles_role_idx on public.user_roles (role);

alter table public.user_roles enable row level security;

create policy "user_roles: read own or admin"
  on public.user_roles for select
  using (auth.uid() = user_id or public.is_admin());

create policy "user_roles: insert own"
  on public.user_roles for insert
  with check (auth.uid() = user_id);

create policy "user_roles: update own"
  on public.user_roles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────── role_profiles ───────────────────────────────
-- Per-role extended profile data stored as JSONB.
-- e.g. farmer: { farm_location, primary_crops }
--      buyer:  { org_name, typical_commodities, delivery_regions, price_ceiling }
--      transporter: { vehicle_type, capacity_kg, refrigerated, service_area }
--      storage_provider: { facility_type, capacity_units, temp_range, certifications }

create table public.role_profiles (
  id uuid primary key default gen_random_uuid(),
  user_role_id uuid not null references public.user_roles(id) on delete cascade,
  profile_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_role_id)
);

create index role_profiles_user_role_idx on public.role_profiles (user_role_id);

alter table public.role_profiles enable row level security;

create policy "role_profiles: read own or admin"
  on public.role_profiles for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.id = role_profiles.user_role_id
        and (ur.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "role_profiles: insert own"
  on public.role_profiles for insert
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.id = role_profiles.user_role_id
        and ur.user_id = auth.uid()
    )
  );

create policy "role_profiles: update own"
  on public.role_profiles for update
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.id = role_profiles.user_role_id
        and ur.user_id = auth.uid()
    )
  );

-- ─────────────────────────────── migrate existing roles ───────────────────────────────
-- Copy existing profiles.role values into user_roles so nothing breaks.

insert into public.user_roles (user_id, role, status)
select id, role, 'active'
from public.profiles
where role in ('farmer', 'buyer', 'transporter', 'storage_provider')
on conflict (user_id, role) do nothing;

-- ─────────────────────────────── sync trigger ───────────────────────────────
-- When a new user_role is inserted, update profiles.role to keep backward compat.
-- Uses the "primary" role (first active role) for the denormalized column.

create or replace function public.sync_primary_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = (
    select ur.role
    from public.user_roles ur
    where ur.user_id = new.user_id and ur.status = 'active'
    order by ur.created_at
    limit 1
  )
  where id = new.user_id;
  return new;
end;
$$;

create trigger after_user_role_insert
  after insert on public.user_roles
  for each row execute function public.sync_primary_role();

-- ─────────────────────────────── auto-farmer on signup ───────────────────────────────
-- Extend the existing handle_new_user trigger to also insert a farmer role.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_profile_id uuid;
begin
  insert into public.profiles (id, full_name, email, source)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'fullName', split_part(new.email, '@', 1)),
    new.email,
    'signup'
  )
  returning id into new_profile_id;

  -- Auto-assign farmer role for all new users
  insert into public.user_roles (user_id, role, status)
  values (new_profile_id, 'farmer', 'active');

  return new;
end;
$$;
