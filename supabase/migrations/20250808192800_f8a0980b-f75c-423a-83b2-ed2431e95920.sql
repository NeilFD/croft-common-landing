
-- 1) Create table for secret words
create table if not exists public.secret_words (
  id uuid primary key default gen_random_uuid(),
  word text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2) Enable RLS
alter table public.secret_words enable row level security;

-- 3) Allow public read-only access (no insert/update/delete for anon)
drop policy if exists "Public can read secret words" on public.secret_words;
create policy "Public can read secret words"
  on public.secret_words
  for select
  using (true);

-- 4) Seed 50 words (insert only if table is empty)
-- Note: The unique constraint prevents duplicates if you later re-run inserts.
insert into public.secret_words (word) values
  ('hops'),
  ('malt'),
  ('barley'),
  ('yeast'),
  ('mash'),
  ('wort'),
  ('lager'),
  ('ale'),
  ('stout'),
  ('porter'),
  ('pilsner'),
  ('saison'),
  ('kolsch'),
  ('amber'),
  ('bitter'),
  ('cask'),
  ('keg'),
  ('taproom'),
  ('growler'),
  ('pint'),
  ('hoppy'),
  ('session'),
  ('barrel'),
  ('cellar'),
  ('craft'),
  ('brew'),
  ('bristol'),
  ('stokes'),
  ('croft'),
  ('common'),
  ('mural'),
  ('banksy'),
  ('clifton'),
  ('harbourside'),
  ('avon'),
  ('brunel'),
  ('balloon'),
  ('gloucester'),
  ('lakota'),
  ('turboisland'),
  ('montpelier'),
  ('stpauls'),
  ('hospitality'),
  ('cheers'),
  ('notsocommon'),
  ('blueglass'),
  ('graff'),
  ('goodcheer'),
  ('taplist'),
  ('northstreet')
on conflict (word) do nothing;
