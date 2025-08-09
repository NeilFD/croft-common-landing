
-- 1) Monthly cinema release info
create table public.cinema_releases (
  id uuid primary key default gen_random_uuid(),
  month_key date not null unique,            -- first day of month (e.g., 2025-08-01)
  screening_date date not null,              -- computed: last Thursday of the month
  doors_time time not null default time '19:00',     -- 7:00 PM
  screening_time time not null default time '19:30', -- 7:30 PM
  title text,
  description text,
  poster_url text,
  capacity smallint not null default 50,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.cinema_releases enable row level security;

create policy "Public can read cinema releases"
  on public.cinema_releases
  for select
  using (true);

-- 2) User bookings (one row per booking: quantity 1 or 2)
create table public.cinema_bookings (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.cinema_releases(id) on delete cascade,
  user_id uuid not null,
  email text not null,
  primary_name text not null,
  guest_name text,
  quantity smallint not null check (quantity in (1,2)),
  ticket_numbers smallint[] not null, -- sequential numbers assigned at booking (e.g., {12} or {23,24})
  created_at timestamptz not null default now(),
  unique (release_id, user_id),
  unique (release_id, email)
);

create index cinema_bookings_release_id_idx on public.cinema_bookings(release_id);

alter table public.cinema_bookings enable row level security;

create policy "Users can view their own bookings"
  on public.cinema_bookings
  for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies: clients won't write directly (enforced via SECURITY DEFINER function)

-- 3) Helpers and booking functions

-- Compute last Thursday for a given month
create or replace function public.get_last_thursday(month_start date)
returns date
language plpgsql
stable
as $$
declare
  last_day date := (date_trunc('month', month_start) + interval '1 month - 1 day')::date;
  off int := ((extract(dow from last_day)::int - 4 + 7) % 7); -- Thursday = 4
begin
  return last_day - off;
end;
$$;

-- Ensure the current month's release exists (auto-creates on first access)
create or replace function public.get_or_create_current_release()
returns public.cinema_releases
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  m date := date_trunc('month', now())::date;
  r public.cinema_releases;
begin
  insert into public.cinema_releases (month_key, screening_date)
  values (m, public.get_last_thursday(m))
  on conflict (month_key) do nothing;

  select * into r
  from public.cinema_releases
  where month_key = m;

  return r;
end;
$$;

-- Public status for current month (capacity, sold, left, dates, etc.)
create or replace function public.get_cinema_status()
returns table (
  release_id uuid,
  month_key date,
  screening_date date,
  doors_time time,
  screening_time time,
  capacity int,
  tickets_sold int,
  tickets_left int,
  is_sold_out boolean,
  title text,
  description text,
  poster_url text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.cinema_releases;
  sold int;
begin
  r := public.get_or_create_current_release();

  select coalesce(sum(b.quantity), 0)
  into sold
  from public.cinema_bookings b
  where b.release_id = r.id;

  return query
  select
    r.id as release_id,
    r.month_key,
    r.screening_date,
    r.doors_time,
    r.screening_time,
    r.capacity::int,
    sold,
    greatest(r.capacity - sold, 0) as tickets_left,
    (sold >= r.capacity) as is_sold_out,
    r.title,
    r.description,
    r.poster_url;
end;
$$;

-- Atomically allocate 1 or 2 tickets to the current month's release
create or replace function public.create_cinema_booking(
  _user_id uuid,
  _email text,
  _primary_name text,
  _guest_name text,
  _quantity smallint
)
returns table (
  booking_id uuid,
  release_id uuid,
  ticket_numbers smallint[],
  tickets_left int
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  r public.cinema_releases;
  sold int;
  start_num int;
  nums smallint[];
  cap int;
  lock_key bigint;
begin
  if _quantity not in (1,2) then
    raise exception 'Quantity must be 1 or 2';
  end if;

  if _quantity = 2 and (coalesce(btrim(_guest_name), '') = '') then
    raise exception 'Guest name is required when booking 2 tickets';
  end if;

  r := public.get_or_create_current_release();
  cap := r.capacity;

  -- Use advisory transaction lock keyed to the monthly release to prevent race conditions
  select ('x' || substr(md5(r.id::text), 1, 16))::bit(64)::bigint into lock_key;
  perform pg_advisory_xact_lock(lock_key);

  -- Has this user/email already booked this month?
  if exists (
    select 1 from public.cinema_bookings b
    where b.release_id = r.id
      and (b.user_id = _user_id or lower(b.email) = lower(_email))
  ) then
    raise exception 'You have already booked tickets for this month';
  end if;

  -- Count already sold tickets
  select coalesce(sum(b.quantity), 0) into sold
  from public.cinema_bookings b
  where b.release_id = r.id;

  if sold + _quantity > cap then
    raise exception 'Sold out or not enough tickets left';
  end if;

  start_num := sold + 1;

  select array_agg(g::smallint) into nums
  from generate_series(start_num, start_num + _quantity - 1) g;

  insert into public.cinema_bookings (release_id, user_id, email, primary_name, guest_name, quantity, ticket_numbers)
  values (r.id, _user_id, _email, _primary_name, nullif(btrim(_guest_name), ''), _quantity, nums)
  returning id into booking_id;

  return query
  select booking_id, r.id as release_id, nums,
         greatest(cap - (sold + _quantity), 0) as tickets_left;
end;
$$;
