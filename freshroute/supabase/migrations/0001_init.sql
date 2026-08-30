-- FreshRoute — initial schema, RLS and storage
-- Run in the Supabase SQL Editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ─────────────────────────────── helpers ───────────────────────────────

create sequence customer_code_seq start 1;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─────────────────────────────── profiles ───────────────────────────────
-- id mirrors auth.users but is NOT a hard FK (seed customers have no auth row).

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  city text not null default '',
  address text not null default '',
  role text not null default 'farmer' check (role in ('farmer', 'admin')),
  customer_code text not null unique default 'FR-C' || lpad(nextval('customer_code_seq')::text, 4, '0'),
  source text not null default 'signup' check (source in ('signup', 'seed')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own or admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.profiles p where p.id = auth.uid()));

-- auto-create a profile whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, source)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'fullName', split_part(new.email, '@', 1)),
    new.email,
    'signup'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────── orders ───────────────────────────────

create table public.orders (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  crop text not null,
  quantity_kg numeric not null,
  packaging text not null default 'crates',
  grade text not null default 'B',
  buyer_name text not null default '',
  destination text not null default '',
  price_per_kg numeric not null default 0,
  gross numeric not null default 0,
  net numeric not null default 0,
  final_net numeric,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid')),
  payment_terms text not null default '',
  steps jsonb not null default '[]'::jsonb,
  source text not null default 'agent' check (source in ('agent', 'seed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index orders_user_created_idx on public.orders (user_id, created_at desc);
create index orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

create policy "orders: read own or admin"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "orders: insert own"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "orders: update own or admin"
  on public.orders for update
  using (auth.uid() = user_id or public.is_admin());

-- ─────────────────────────────── reviews ───────────────────────────────

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id text references public.orders(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  feedback text not null default '',
  created_at timestamptz not null default now()
);

create index reviews_user_idx on public.reviews (user_id);

alter table public.reviews enable row level security;

create policy "reviews: read own or admin"
  on public.reviews for select
  using (auth.uid() = user_id or public.is_admin());

create policy "reviews: insert own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────── notifications ───────────────────────────────

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null default '',
  kind text not null default 'info' check (kind in ('delay', 'price', 'info', 'order')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: read own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications: insert own"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "notifications: update own"
  on public.notifications for update
  using (auth.uid() = user_id);

-- ─────────────────────────────── audit_log ───────────────────────────────

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor text not null check (actor in ('Agent', 'You', 'System')),
  action text not null,
  approved boolean,
  created_at timestamptz not null default now()
);

create index audit_user_idx on public.audit_log (user_id, created_at desc);

alter table public.audit_log enable row level security;

create policy "audit: read own or admin"
  on public.audit_log for select
  using (auth.uid() = user_id or public.is_admin());

create policy "audit: insert own"
  on public.audit_log for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────── chat persistence ───────────────────────────────

create table public.chat_messages (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  msg jsonb not null,
  created_at timestamptz not null default now()
);

create index chat_messages_user_idx on public.chat_messages (user_id, created_at);

alter table public.chat_messages enable row level security;

create policy "chat: all own"
  on public.chat_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat: admin read"
  on public.chat_messages for select
  using (public.is_admin());

create table public.chat_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stage text not null default 'welcome',
  lot jsonb,
  scenarios jsonb,
  quick_replies jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.chat_state enable row level security;

create policy "chat_state: all own"
  on public.chat_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────── image analyses ───────────────────────────────

create table public.image_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id text references public.orders(id) on delete set null,
  image_path text not null default '',
  crop_hint text not null default '',
  grade text not null default 'B',
  ripeness text not null default '',
  defect_rate numeric not null default 0,
  notes jsonb not null default '[]'::jsonb,
  confidence numeric not null default 0,
  model text not null default '',
  source text not null default 'fallback' check (source in ('gemini', 'fallback')),
  created_at timestamptz not null default now()
);

create index image_analyses_user_idx on public.image_analyses (user_id, created_at desc);

alter table public.image_analyses enable row level security;

create policy "image_analyses: read own or admin"
  on public.image_analyses for select
  using (auth.uid() = user_id or public.is_admin());

create policy "image_analyses: insert own"
  on public.image_analyses for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────── ai usage (written by the edge function) ───────────────────────────────

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  model text not null default '',
  status text not null check (status in ('ok', 'error')),
  error text,
  latency_ms int,
  created_at timestamptz not null default now()
);

create index ai_usage_created_idx on public.ai_usage (created_at desc);

alter table public.ai_usage enable row level security;

create policy "ai_usage: read own or admin"
  on public.ai_usage for select
  using ((auth.uid() = user_id) or public.is_admin());

-- ─────────────────────────────── customer metrics view ───────────────────────────────
-- Transparent score: 50% avg rating + 30% completion rate + 20% non-cancellation.

create view public.customer_metrics
with (security_invoker = true) as
  select
    p.id as user_id,
    p.full_name,
    p.city,
    p.customer_code,
    p.source,
    p.created_at,
    (select count(*) from public.orders o where o.user_id = p.id) as total_orders,
    (select count(*) from public.orders o where o.user_id = p.id and o.status = 'completed') as completed_orders,
    (select count(*) from public.orders o where o.user_id = p.id and o.status = 'cancelled') as cancelled_orders,
    (select count(*) from public.orders o where o.user_id = p.id and o.status = 'active') as active_orders,
    coalesce((select sum(o.final_net) from public.orders o where o.user_id = p.id and o.status = 'completed'), 0) as total_earned,
    coalesce((select sum(o.gross) from public.orders o where o.user_id = p.id and o.status = 'completed'), 0) as total_sales_value,
    coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.user_id = p.id), 0) as avg_rating,
    (select count(*) from public.reviews r where r.user_id = p.id) as review_count,
    round(
      50 * coalesce((select avg(r.rating) / 5.0 from public.reviews r where r.user_id = p.id), 0)
      + 30 * (case when (select count(*) from public.orders o where o.user_id = p.id) = 0 then 0
                   else (select count(*)::numeric from public.orders o where o.user_id = p.id and o.status = 'completed')
                        / (select count(*) from public.orders o where o.user_id = p.id) end)
      + 20 * (case when (select count(*) from public.orders o where o.user_id = p.id) = 0 then 1
                   else 1 - (select count(*)::numeric from public.orders o where o.user_id = p.id and o.status = 'cancelled')
                          / (select count(*) from public.orders o where o.user_id = p.id) end)
    , 0) as customer_score
  from public.profiles p;

-- ─────────────────────────────── storage ───────────────────────────────

insert into storage.buckets (id, name, public)
values ('lot-photos', 'lot-photos', true)
on conflict (id) do nothing;

create policy "lot-photos: public read"
  on storage.objects for select
  using (bucket_id = 'lot-photos');

create policy "lot-photos: authenticated upload"
  on storage.objects for insert
  with check (bucket_id = 'lot-photos' and auth.role() = 'authenticated');
