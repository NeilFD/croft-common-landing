alter table public.lead_activity
  alter column activity_type drop not null,
  alter column activity_type set default 'system',
  alter column type set default 'system';

create or replace function public.lead_activity_legacy_sync()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.type := coalesce(nullif(new.type, ''), nullif(new.activity_type, ''), 'system');
  new.activity_type := coalesce(nullif(new.activity_type, ''), new.type, 'system');
  new.body := coalesce(new.body, new.notes);
  new.notes := coalesce(new.notes, new.body);
  new.author_id := coalesce(new.author_id, new.created_by);
  new.created_by := coalesce(new.created_by, new.author_id);
  new.meta := coalesce(new.meta, '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists trg_lead_activity_legacy_sync on public.lead_activity;
create trigger trg_lead_activity_legacy_sync
before insert or update on public.lead_activity
for each row execute function public.lead_activity_legacy_sync();

create or replace function public.safe_jsonb_bool(value text, fallback boolean default false)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
begin
  if value is null or btrim(value) = '' then
    return fallback;
  end if;
  return value::boolean;
exception when others then
  return fallback;
end;
$$;

create or replace function public.safe_jsonb_int(value text)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  cleaned text := nullif(regexp_replace(coalesce(value, ''), '[^0-9]', '', 'g'), '');
begin
  return cleaned::integer;
exception when others then
  return null;
end;
$$;

create or replace function public.normalise_lead_payload(payload jsonb)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_raw_name text := trim(coalesce(payload->>'name', ''));
  v_first text := trim(coalesce(payload->>'first_name', split_part(v_raw_name, ' ', 1)));
  v_last text := trim(coalesce(payload->>'last_name', nullif(trim(substr(v_raw_name, length(split_part(v_raw_name, ' ', 1)) + 1)), '')));
  v_budget_low integer := public.safe_jsonb_int(coalesce(payload->>'budget_low', payload->>'budget'));
  v_budget_high integer := public.safe_jsonb_int(coalesce(payload->>'budget_high', payload->>'budget'));
begin
  return jsonb_build_object(
    'first_name', coalesce(nullif(v_first, ''), 'Unknown'),
    'last_name', coalesce(v_last, ''),
    'email', lower(trim(coalesce(payload->>'email', ''))),
    'phone', nullif(trim(coalesce(payload->>'phone', '')), ''),
    'event_type', nullif(trim(coalesce(payload->>'event_type', '')), ''),
    'preferred_space', nullif(coalesce(payload->>'preferred_space', payload->>'recommended_space_id'), ''),
    'preferred_date', nullif(coalesce(payload->>'preferred_date', payload->>'event_date'), ''),
    'date_flexible', public.safe_jsonb_bool(payload->>'date_flexible', false),
    'headcount', public.safe_jsonb_int(coalesce(payload->>'headcount', payload->>'guest_count', payload->>'guests')),
    'budget_low', v_budget_low,
    'budget_high', v_budget_high,
    'message', nullif(trim(coalesce(payload->>'message', payload->>'notes', '')), ''),
    'source', coalesce(nullif(trim(payload->>'source'), ''), 'enquiry_form'),
    'utm', coalesce(payload->'utm', '{}'::jsonb),
    'details', coalesce(payload->'details', '{}'::jsonb),
    'event_enquiry_id', nullif(payload->>'event_enquiry_id', ''),
    'consent_marketing', public.safe_jsonb_bool(payload->>'consent_marketing', false),
    'privacy_accepted', public.safe_jsonb_bool(payload->>'privacy_accepted', false)
  );
end;
$$;