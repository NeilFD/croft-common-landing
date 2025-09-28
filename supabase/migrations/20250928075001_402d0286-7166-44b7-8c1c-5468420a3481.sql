-- Add lead_id to management_events if missing and set up FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'management_events' 
      AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE public.management_events
      ADD COLUMN lead_id uuid NULL;
  END IF;
END$$;

-- Add FK to leads (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'management_events_lead_id_fkey'
  ) THEN
    ALTER TABLE public.management_events
      ADD CONSTRAINT management_events_lead_id_fkey
      FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
  END IF;
END$$;

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS idx_management_events_lead_id ON public.management_events(lead_id);

-- Create or replace create_management_event RPC to store client + lead link
CREATE OR REPLACE FUNCTION public.create_management_event(
  p_event_type text,
  p_headcount integer,
  p_notes text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_start_time text DEFAULT NULL,
  p_budget numeric DEFAULT NULL,
  p_client_name text DEFAULT NULL,
  p_client_email text DEFAULT NULL,
  p_client_phone text DEFAULT NULL,
  p_lead_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  gen_code text;
BEGIN
  -- Generate a simple event code if none is provided elsewhere
  gen_code := 'EV-' || to_char(now(), 'YYMMDD') || '-' || substr(md5(gen_random_uuid()::text), 1, 4);

  INSERT INTO public.management_events (
    event_type,
    headcount,
    notes,
    primary_date,
    budget,
    client_name,
    client_email,
    client_phone,
    status,
    code,
    owner_id,
    created_at,
    updated_at,
    lead_id
  ) VALUES (
    p_event_type,
    p_headcount,
    p_notes,
    p_start_date,
    p_budget,
    p_client_name,
    p_client_email,
    p_client_phone,
    'draft',
    gen_code,
    auth.uid(),
    now(),
    now(),
    p_lead_id
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Create or replace update_management_event RPC to allow patching, including client + lead fields
CREATE OR REPLACE FUNCTION public.update_management_event(
  p_id uuid,
  patch jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.management_events SET
    event_type = COALESCE((patch->>'event_type')::text, event_type),
    headcount = COALESCE(NULLIF(patch->>'headcount','')::int, headcount),
    notes = COALESCE((patch->>'notes')::text, notes),
    status = COALESCE((patch->>'status')::text, status),
    primary_date = COALESCE((patch->>'primary_date')::date, primary_date),
    budget = COALESCE(NULLIF(patch->>'budget','')::numeric, budget),
    client_name = COALESCE((patch->>'client_name')::text, client_name),
    client_email = COALESCE((patch->>'client_email')::text, client_email),
    client_phone = COALESCE((patch->>'client_phone')::text, client_phone),
    lead_id = COALESCE(NULLIF(patch->>'lead_id','')::uuid, lead_id),
    updated_at = now()
  WHERE id = p_id;
END;
$$;