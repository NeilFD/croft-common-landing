-- Create tables for WebAuthn credentials and challenges
create table if not exists public.webauthn_users (
  user_handle text primary key,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.webauthn_users enable row level security;
-- Public read not required; access via edge function with service role

create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_handle text not null references public.webauthn_users(user_handle) on delete cascade,
  credential_id text not null unique, -- base64url
  public_key text not null,           -- base64url or PEM
  counter bigint not null default 0,
  device_type text,
  backed_up boolean,
  transports text[],
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.webauthn_credentials enable row level security;

create table if not exists public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_handle text not null,
  type text not null check (type in ('registration','authentication')),
  challenge text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

alter table public.webauthn_challenges enable row level security;

-- Minimal policies (edge functions will use service role). Prevent direct public access
create policy "No direct access" on public.webauthn_users for all using (false) with check (false);
create policy "No direct access" on public.webauthn_credentials for all using (false) with check (false);
create policy "No direct access" on public.webauthn_challenges for all using (false) with check (false);

-- Indexes for performance
create index if not exists idx_webauthn_credentials_user_handle on public.webauthn_credentials(user_handle);
create index if not exists idx_webauthn_challenges_user_handle on public.webauthn_challenges(user_handle);
create index if not exists idx_webauthn_challenges_expires_at on public.webauthn_challenges(expires_at);
