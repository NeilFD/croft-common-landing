
-- Table: public.push_subscriptions
-- Stores Web Push subscriptions. Anonymous inserts allowed; no public reads.
-- Service role (edge function) will handle sends and cleanup.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_seen timestamptz,
  user_id uuid, -- nullable; set if user is logged in when subscribing
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  platform text,
  is_active boolean not null default true
);

-- Avoid duplicates by endpoint
create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Anyone can INSERT (so anonymous users can subscribe)
create policy "Public can insert push subscriptions"
  on public.push_subscriptions
  for insert
  with check (true);

-- Only authenticated users can SELECT their own subscriptions
create policy "Users can view their own subscriptions"
  on public.push_subscriptions
  for select
  using (auth.uid() is not null and user_id = auth.uid());

-- No UPDATE/DELETE policies -> blocked for anon/auth users.
-- Edge functions using the service role bypass RLS for maintenance tasks.

