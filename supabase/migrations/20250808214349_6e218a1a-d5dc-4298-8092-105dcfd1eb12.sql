
-- 1) Enum for card type
create type public.loyalty_card_type as enum ('regular', 'lucky7');

-- 2) Loyalty cards table
create table public.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_type public.loyalty_card_type not null default 'regular',
  punches_required smallint not null default 6,
  rewards_required smallint not null default 1,
  punches_count smallint not null default 0,
  rewards_count smallint not null default 0,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to keep updated_at fresh
create trigger loyalty_cards_set_updated_at
before update on public.loyalty_cards
for each row
execute function public.update_updated_at_column();

-- Index for efficient lookups by user and completion state
create index loyalty_cards_user_incomplete_idx on public.loyalty_cards (user_id, is_complete);

-- Enable RLS
alter table public.loyalty_cards enable row level security;

-- Policies for loyalty_cards
create policy "Users can view their own loyalty cards"
on public.loyalty_cards for select
to authenticated
using (auth.uid() = user_id);

create policy "Subscribers can create their own loyalty cards"
on public.loyalty_cards for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.subscribers s
    where s.email = public.get_user_email()
      and s.is_active = true
  )
);

create policy "Users can update their own loyalty cards"
on public.loyalty_cards for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own loyalty cards"
on public.loyalty_cards for delete
to authenticated
using (auth.uid() = user_id);

-- 3) Loyalty entries table (one per box)
create table public.loyalty_entries (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.loyalty_cards(id) on delete cascade,
  index smallint not null check (index between 1 and 7),
  kind text not null check (kind in ('punch','reward')),
  image_url text not null,
  created_at timestamptz not null default now(),
  unique(card_id, index)
);

-- Enable RLS
alter table public.loyalty_entries enable row level security;

-- Policies for loyalty_entries (link through card ownership)
create policy "Users can view entries for their cards"
on public.loyalty_entries for select
to authenticated
using (
  exists (
    select 1 from public.loyalty_cards c
    where c.id = card_id and c.user_id = auth.uid()
  )
);

create policy "Users can add entries to their cards"
on public.loyalty_entries for insert
to authenticated
with check (
  exists (
    select 1 from public.loyalty_cards c
    where c.id = card_id and c.user_id = auth.uid()
  )
);

create policy "Users can update entries on their cards"
on public.loyalty_entries for update
to authenticated
using (
  exists (
    select 1 from public.loyalty_cards c
    where c.id = card_id and c.user_id = auth.uid()
  )
);

create policy "Users can delete entries on their cards"
on public.loyalty_entries for delete
to authenticated
using (
  exists (
    select 1 from public.loyalty_cards c
    where c.id = card_id and c.user_id = auth.uid()
  )
);

-- 4) Private Storage bucket for loyalty images
insert into storage.buckets (id, name, public)
select 'loyalty', 'loyalty', false
where not exists (select 1 from storage.buckets where id = 'loyalty');

-- Storage policies (users can only access their own files)
create policy "Loyalty: users can read own files"
on storage.objects for select
to authenticated
using (bucket_id = 'loyalty' and owner = auth.uid());

create policy "Loyalty: users can upload files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'loyalty');

create policy "Loyalty: users can update own files"
on storage.objects for update
to authenticated
using (bucket_id = 'loyalty' and owner = auth.uid())
with check (bucket_id = 'loyalty' and owner = auth.uid());

create policy "Loyalty: users can delete own files"
on storage.objects for delete
to authenticated
using (bucket_id = 'loyalty' and owner = auth.uid());
