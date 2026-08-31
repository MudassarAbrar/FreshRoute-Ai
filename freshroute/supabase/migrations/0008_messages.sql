-- FreshRoute — messages table (Phase 4.2)
-- Real message persistence for buyer-seller communication.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.profiles(id),
  recipient_user_id uuid not null references public.profiles(id),
  listing_id uuid references public.listings(id),
  content text not null,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'read', 'failed')),
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'sms', 'in_app')),
  created_at timestamptz not null default now()
);

-- RLS: users can read their own messages (sent or received)
create policy "messages: read own"
  on public.messages for select
  using (
    auth.uid() = sender_user_id
    or auth.uid() = recipient_user_id
  );

-- RLS: users can insert their own messages
create policy "messages: insert own"
  on public.messages for insert
  with check (auth.uid() = sender_user_id);

-- RLS: users can update status on messages they received
create policy "messages: update received status"
  on public.messages for update
  using (auth.uid() = recipient_user_id);

-- Index for efficient message lookups
create index if not exists idx_messages_sender on public.messages(sender_user_id, created_at desc);
create index if not exists idx_messages_recipient on public.messages(recipient_user_id, created_at desc);
create index if not exists idx_messages_listing on public.messages(listing_id, created_at desc);
