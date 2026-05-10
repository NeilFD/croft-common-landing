alter table public.leads
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists owner_id uuid,
  add column if not exists preferred_space uuid,
  add column if not exists preferred_date date,
  add column if not exists date_flexible boolean not null default false,
  add column if not exists headcount integer,
  add column if not exists budget_low integer,
  add column if not exists budget_high integer,
  add column if not exists message text,
  add column if not exists source text,
  add column if not exists utm jsonb not null default '{}'::jsonb,
  add column if not exists event_enquiry_id uuid,
  add column if not exists details jsonb not null default '{}'::jsonb,
  add column if not exists consent_marketing boolean not null default false,
  add column if not exists privacy_accepted boolean not null default false,
  add column if not exists search_tsv tsvector;

update public.leads
set
  first_name = coalesce(nullif(first_name, ''), split_part(trim(name), ' ', 1)),
  last_name = coalesce(nullif(last_name, ''), nullif(trim(substr(trim(name), length(split_part(trim(name), ' ', 1)) + 1)), '')),
  owner_id = coalesce(owner_id, assigned_to),
  preferred_date = coalesce(preferred_date, event_date),
  headcount = coalesce(headcount, guests),
  budget_low = coalesce(budget_low, budget::integer),
  budget_high = coalesce(budget_high, budget::integer),
  message = coalesce(message, notes),
  source = coalesce(source, 'legacy'),
  details = coalesce(details, '{}'::jsonb)
where first_name is null
   or preferred_date is null
   or headcount is null
   or budget_low is null
   or message is null
   or source is null;

update public.leads l
set
  preferred_space = coalesce(l.preferred_space, nullif(e.details->>'recommended_space_id', '')::uuid),
  event_enquiry_id = coalesce(l.event_enquiry_id, e.id),
  source = case when l.source = 'legacy' then 'ask_the_bear' else l.source end,
  details = case when l.details = '{}'::jsonb then e.details else l.details || jsonb_build_object('event_enquiry', e.details) end,
  privacy_accepted = true
from public.cb_enquiries e
where e.category = 'event'
  and lower(e.email) = lower(l.email)
  and abs(extract(epoch from (l.created_at - e.created_at))) < 30;

update public.leads
set
  first_name = coalesce(nullif(first_name, ''), 'Unknown'),
  last_name = coalesce(last_name, ''),
  status = coalesce(status, 'new'),
  date_flexible = coalesce(date_flexible, false),
  utm = coalesce(utm, '{}'::jsonb),
  details = coalesce(details, '{}'::jsonb),
  consent_marketing = coalesce(consent_marketing, false),
  privacy_accepted = coalesce(privacy_accepted, false);

alter table public.leads
  alter column first_name set not null,
  alter column last_name set not null,
  alter column status set not null,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.leads
  drop constraint if exists leads_preferred_space_fkey,
  add constraint leads_preferred_space_fkey foreign key (preferred_space) references public.spaces(id) on delete set null;

alter table public.leads
  drop constraint if exists leads_event_enquiry_id_fkey,
  add constraint leads_event_enquiry_id_fkey foreign key (event_enquiry_id) references public.cb_enquiries(id) on delete set null;

alter table public.lead_activity
  add column if not exists type text,
  add column if not exists body text,
  add column if not exists author_id uuid,
  add column if not exists meta jsonb not null default '{}'::jsonb;

update public.lead_activity
set
  type = coalesce(type, activity_type, 'note'),
  body = coalesce(body, notes),
  author_id = coalesce(author_id, created_by),
  meta = coalesce(meta, '{}'::jsonb);

alter table public.lead_activity
  alter column type set not null,
  alter column meta set default '{}'::jsonb,
  alter column created_at set default now();

alter table public.lead_activity
  drop constraint if exists lead_activity_lead_id_fkey,
  add constraint lead_activity_lead_id_fkey foreign key (lead_id) references public.leads(id) on delete cascade;

create or replace function public.set_leads_search_tsv()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('simple', coalesce(new.first_name, '') || ' ' || coalesce(new.last_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.email, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.phone, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.event_type, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.message, '')), 'C');
  new.updated_at := now();
  return new;
end;
$$;

update public.leads
set search_tsv =
  setweight(to_tsvector('simple', coalesce(first_name, '') || ' ' || coalesce(last_name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(email, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(phone, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(event_type, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(message, '')), 'C');

drop trigger if exists trg_set_leads_search_tsv on public.leads;
create trigger trg_set_leads_search_tsv
before insert or update on public.leads
for each row execute function public.set_leads_search_tsv();

create index if not exists idx_leads_created_at on public.leads(created_at desc);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_preferred_space on public.leads(preferred_space);
create index if not exists idx_leads_event_enquiry_id on public.leads(event_enquiry_id);
create index if not exists idx_leads_search_tsv on public.leads using gin(search_tsv);
create index if not exists idx_lead_activity_lead_id_created_at on public.lead_activity(lead_id, created_at desc);

alter table public.leads enable row level security;
alter table public.lead_activity enable row level security;

drop policy if exists leads_management_select on public.leads;
drop policy if exists leads_management_insert on public.leads;
drop policy if exists leads_management_update on public.leads;
drop policy if exists leads_management_delete on public.leads;
drop policy if exists lead_activity_management_select on public.lead_activity;
drop policy if exists lead_activity_management_insert on public.lead_activity;
drop policy if exists lead_activity_management_update on public.lead_activity;
drop policy if exists lead_activity_management_delete on public.lead_activity;

create policy leads_management_select on public.leads
for select to authenticated
using (
  public.has_management_role(auth.uid(), 'admin')
  or public.has_management_role(auth.uid(), 'sales')
  or public.has_management_role(auth.uid(), 'ops')
  or public.has_management_role(auth.uid(), 'finance')
  or public.has_management_role(auth.uid(), 'readonly')
);

create policy leads_management_insert on public.leads
for insert to authenticated
with check (
  public.has_management_role(auth.uid(), 'admin')
  or public.has_management_role(auth.uid(), 'sales')
);

create policy leads_management_update on public.leads
for update to authenticated
using (
  public.has_management_role(auth.uid(), 'admin')
  or public.has_management_role(auth.uid(), 'sales')
)
with check (
  public.has_management_role(auth.uid(), 'admin')
  or public.has_management_role(auth.uid(), 'sales')
);

create policy leads_management_delete on public.leads
for delete to authenticated
using (public.has_management_role(auth.uid(), 'admin'));

create policy lead_activity_management_select on public.lead_activity
for select to authenticated
using (
  public.has_management_role(auth.uid(), 'admin')
  or public.has_management_role(auth.uid(), 'sales')
  or public.has_management_role(auth.uid(), 'ops')
  or public.has_management_role(auth.uid(), 'finance')
  or public.has_management_role(auth.uid(), 'readonly')
);

create policy lead_activity_management_insert on public.lead_activity
for insert to authenticated
with check (
  public.has_management_role(auth.uid(), 'admin')
  or public.has_management_role(auth.uid(), 'sales')
);

create policy lead_activity_management_update on public.lead_activity
for update to authenticated
using (public.has_management_role(auth.uid(), 'admin'))
with check (public.has_management_role(auth.uid(), 'admin'));

create policy lead_activity_management_delete on public.lead_activity
for delete to authenticated
using (public.has_management_role(auth.uid(), 'admin'));

create or replace function public.normalise_lead_payload(payload jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_first text := trim(coalesce(payload->>'first_name', split_part(trim(coalesce(payload->>'name', '')), ' ', 1)));
  v_last text := trim(coalesce(payload->>'last_name', nullif(trim(substr(trim(coalesce(payload->>'name', '')), length(split_part(trim(coalesce(payload->>'name', '')), ' ', 1)) + 1)), '')));
  v_budget_low integer := nullif(regexp_replace(coalesce(payload->>'budget_low', payload->>'budget'), '[^0-9]', '', 'g'), '')::integer;
  v_budget_high integer := nullif(regexp_replace(coalesce(payload->>'budget_high', payload->>'budget'), '[^0-9]', '', 'g'), '')::integer;
begin
  return jsonb_build_object(
    'first_name', coalesce(nullif(v_first, ''), 'Unknown'),
    'last_name', coalesce(v_last, ''),
    'email', lower(trim(coalesce(payload->>'email', ''))),
    'phone', nullif(trim(coalesce(payload->>'phone', '')), ''),
    'event_type', nullif(trim(coalesce(payload->>'event_type', '')), ''),
    'preferred_space', nullif(coalesce(payload->>'preferred_space', payload->>'recommended_space_id'), ''),
    'preferred_date', nullif(coalesce(payload->>'preferred_date', payload->>'event_date'), ''),
    'date_flexible', coalesce((payload->>'date_flexible')::boolean, false),
    'headcount', nullif(regexp_replace(coalesce(payload->>'headcount', payload->>'guest_count', payload->>'guests'), '[^0-9]', '', 'g'), '')::integer,
    'budget_low', v_budget_low,
    'budget_high', v_budget_high,
    'message', nullif(trim(coalesce(payload->>'message', payload->>'notes', '')), ''),
    'source', coalesce(nullif(trim(payload->>'source'), ''), 'enquiry_form'),
    'utm', coalesce(payload->'utm', '{}'::jsonb),
    'details', coalesce(payload->'details', '{}'::jsonb),
    'event_enquiry_id', nullif(payload->>'event_enquiry_id', ''),
    'consent_marketing', coalesce((payload->>'consent_marketing')::boolean, false),
    'privacy_accepted', coalesce((payload->>'privacy_accepted')::boolean, false)
  );
end;
$$;

create or replace function public.create_lead(payload jsonb, client_ip text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  p jsonb := public.normalise_lead_payload(payload);
  new_lead_id uuid;
  v_space uuid := nullif(p->>'preferred_space', '')::uuid;
  v_enquiry uuid := nullif(p->>'event_enquiry_id', '')::uuid;
  v_name text;
begin
  if p->>'email' !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email is required';
  end if;

  if length(p->>'first_name') < 1 then
    raise exception 'First name is required';
  end if;

  if (p->>'source') = 'management' and not (
    public.has_management_role(auth.uid(), 'admin') or public.has_management_role(auth.uid(), 'sales')
  ) then
    raise exception 'You do not have permission to create management leads';
  end if;

  v_name := trim((p->>'first_name') || ' ' || coalesce(p->>'last_name', ''));

  insert into public.leads (
    name, email, phone, event_type, event_date, guests, budget, notes, status,
    first_name, last_name, preferred_space, preferred_date, date_flexible,
    headcount, budget_low, budget_high, message, source, utm, details,
    event_enquiry_id, consent_marketing, privacy_accepted
  ) values (
    v_name, p->>'email', nullif(p->>'phone', ''), nullif(p->>'event_type', ''), nullif(p->>'preferred_date', '')::date,
    nullif(p->>'headcount', '')::integer, coalesce(nullif(p->>'budget_high', '')::numeric, nullif(p->>'budget_low', '')::numeric),
    nullif(p->>'message', ''), 'new',
    p->>'first_name', coalesce(p->>'last_name', ''), v_space, nullif(p->>'preferred_date', '')::date, (p->>'date_flexible')::boolean,
    nullif(p->>'headcount', '')::integer, nullif(p->>'budget_low', '')::integer, nullif(p->>'budget_high', '')::integer,
    nullif(p->>'message', ''), p->>'source', coalesce(p->'utm', '{}'::jsonb), coalesce(p->'details', '{}'::jsonb),
    v_enquiry, (p->>'consent_marketing')::boolean, (p->>'privacy_accepted')::boolean
  ) returning id into new_lead_id;

  insert into public.lead_activity (lead_id, type, body, author_id, meta)
  values (new_lead_id, 'system', 'Lead created', auth.uid(), jsonb_build_object('source', p->>'source', 'client_ip', client_ip));

  return new_lead_id;
end;
$$;

create or replace function public.update_lead(lead_id_param uuid, patch jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_status text;
  new_status text;
begin
  if not (public.has_management_role(auth.uid(), 'admin') or public.has_management_role(auth.uid(), 'sales')) then
    raise exception 'You do not have permission to update leads';
  end if;

  select status into old_status from public.leads where id = lead_id_param;
  if old_status is null then
    raise exception 'Lead not found';
  end if;

  update public.leads set
    status = coalesce(nullif(patch->>'status', ''), status),
    owner_id = coalesce(nullif(patch->>'owner_id', '')::uuid, owner_id),
    assigned_to = coalesce(nullif(patch->>'owner_id', '')::uuid, assigned_to),
    first_name = coalesce(nullif(trim(patch->>'first_name'), ''), first_name),
    last_name = coalesce(trim(coalesce(patch->>'last_name', last_name)), ''),
    name = trim(coalesce(nullif(trim(patch->>'first_name'), ''), first_name) || ' ' || coalesce(trim(coalesce(patch->>'last_name', last_name)), '')),
    email = coalesce(nullif(lower(trim(patch->>'email')), ''), email),
    phone = coalesce(nullif(trim(patch->>'phone'), ''), phone),
    event_type = coalesce(nullif(trim(patch->>'event_type'), ''), event_type),
    preferred_space = coalesce(nullif(patch->>'preferred_space', '')::uuid, preferred_space),
    preferred_date = coalesce(nullif(patch->>'preferred_date', '')::date, preferred_date),
    event_date = coalesce(nullif(patch->>'preferred_date', '')::date, event_date),
    date_flexible = coalesce((patch->>'date_flexible')::boolean, date_flexible),
    headcount = coalesce(nullif(patch->>'headcount', '')::integer, headcount),
    guests = coalesce(nullif(patch->>'headcount', '')::integer, guests),
    budget_low = coalesce(nullif(patch->>'budget_low', '')::integer, budget_low),
    budget_high = coalesce(nullif(patch->>'budget_high', '')::integer, budget_high),
    budget = coalesce(nullif(patch->>'budget_high', '')::numeric, nullif(patch->>'budget_low', '')::numeric, budget),
    message = coalesce(nullif(trim(patch->>'message'), ''), message),
    notes = coalesce(nullif(trim(patch->>'message'), ''), notes)
  where id = lead_id_param;

  select status into new_status from public.leads where id = lead_id_param;

  if old_status is distinct from new_status then
    insert into public.lead_activity (lead_id, type, body, author_id, meta)
    values (lead_id_param, 'status', 'Status changed', auth.uid(), jsonb_build_object('old_status', old_status, 'new_status', new_status));
  end if;
end;
$$;

create or replace function public.reassign_lead(lead_id_param uuid, new_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_owner_id uuid;
begin
  if not (public.has_management_role(auth.uid(), 'admin') or public.has_management_role(auth.uid(), 'sales')) then
    raise exception 'You do not have permission to reassign leads';
  end if;

  select owner_id into old_owner_id from public.leads where id = lead_id_param;
  if not found then
    raise exception 'Lead not found';
  end if;

  update public.leads set owner_id = new_owner_id, assigned_to = new_owner_id where id = lead_id_param;

  insert into public.lead_activity (lead_id, type, body, author_id, meta)
  values (lead_id_param, 'system', 'Lead reassigned', auth.uid(), jsonb_build_object('old_owner_id', old_owner_id, 'new_owner_id', new_owner_id));
end;
$$;

create or replace function public.add_lead_note(lead_id_param uuid, note_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  activity_id uuid;
begin
  if not (public.has_management_role(auth.uid(), 'admin') or public.has_management_role(auth.uid(), 'sales') or public.has_management_role(auth.uid(), 'ops')) then
    raise exception 'You do not have permission to add notes';
  end if;

  if trim(coalesce(note_body, '')) = '' then
    raise exception 'Note body cannot be empty';
  end if;

  insert into public.lead_activity (lead_id, type, body, author_id)
  values (lead_id_param, 'note', trim(note_body), auth.uid())
  returning id into activity_id;

  return activity_id;
end;
$$;

create or replace function public.update_lead_on_booking_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.lead_id is null or new.status != 'definite' then
    return new;
  end if;

  update public.leads
  set status = case when status <> 'lost' then 'won' else status end,
      updated_at = now()
  where id = new.lead_id;

  insert into public.lead_activity(lead_id, type, body, author_id, meta)
  select new.lead_id, 'system', 'Converted to booking', null,
         jsonb_build_object('event', 'converted_to_booking', 'booking_id', new.id)
  where not exists (
    select 1 from public.lead_activity
    where lead_id = new.lead_id
      and meta->>'booking_id' = new.id::text
  );

  return new;
end;
$$;

drop trigger if exists trg_update_lead_on_booking on public.bookings;
create trigger trg_update_lead_on_booking
after insert on public.bookings
for each row execute function public.update_lead_on_booking_creation();

grant execute on function public.create_lead(jsonb, text) to anon, authenticated;
grant execute on function public.update_lead(uuid, jsonb) to authenticated;
grant execute on function public.reassign_lead(uuid, uuid) to authenticated;
grant execute on function public.add_lead_note(uuid, text) to authenticated;