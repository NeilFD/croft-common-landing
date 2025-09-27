-- Phase 2: Leads & CRM Database Setup

-- LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status           text NOT NULL CHECK (status IN ('new','qualified','proposed','won','lost')) DEFAULT 'new',
  owner_id         uuid REFERENCES auth.users(id),
  -- contact info
  first_name       text NOT NULL,
  last_name        text NOT NULL,
  email            text NOT NULL,
  phone            text,
  -- event details
  event_type       text,
  preferred_space  uuid REFERENCES public.spaces(id),
  preferred_date   date,
  date_flexible    boolean DEFAULT false,
  headcount        int,
  budget_low       int,
  budget_high      int,
  message          text,
  -- tracking
  source           text,
  utm              jsonb,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- LEAD ACTIVITY TABLE
CREATE TABLE IF NOT EXISTS public.lead_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('note','status','system','email')),
  body        text,
  author_id   uuid REFERENCES auth.users(id),
  meta        jsonb,
  created_at  timestamptz DEFAULT now()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_leads_owner ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_space ON public.leads(preferred_space);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activity_lead ON public.lead_activity(lead_id, created_at DESC);

-- UPDATED_AT TRIGGER FOR LEADS
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN 
  NEW.updated_at := now(); 
  RETURN NEW; 
END; 
$$;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON public.leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES FOR LEADS
DROP POLICY IF EXISTS leads_select ON public.leads;
CREATE POLICY leads_select ON public.leads
  FOR SELECT USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

DROP POLICY IF EXISTS leads_insert ON public.leads;
CREATE POLICY leads_insert ON public.leads
  FOR INSERT WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

DROP POLICY IF EXISTS leads_update ON public.leads;
CREATE POLICY leads_update ON public.leads
  FOR UPDATE USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  ) WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

DROP POLICY IF EXISTS leads_delete ON public.leads;
CREATE POLICY leads_delete ON public.leads
  FOR DELETE USING (
    has_management_role(auth.uid(), 'admin'::management_role)
  );

-- RLS POLICIES FOR LEAD ACTIVITY
DROP POLICY IF EXISTS lead_activity_select ON public.lead_activity;
CREATE POLICY lead_activity_select ON public.lead_activity
  FOR SELECT USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

DROP POLICY IF EXISTS lead_activity_insert ON public.lead_activity;
CREATE POLICY lead_activity_insert ON public.lead_activity
  FOR INSERT WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- RPC: CREATE LEAD
CREATE OR REPLACE FUNCTION public.create_lead(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_id uuid;
  space_name text;
BEGIN
  -- Validate required fields
  IF payload->>'first_name' IS NULL OR trim(payload->>'first_name') = '' THEN
    RAISE EXCEPTION 'first_name is required';
  END IF;
  
  IF payload->>'last_name' IS NULL OR trim(payload->>'last_name') = '' THEN
    RAISE EXCEPTION 'last_name is required';
  END IF;
  
  IF payload->>'email' IS NULL OR trim(payload->>'email') = '' THEN
    RAISE EXCEPTION 'email is required';
  END IF;
  
  IF payload->>'preferred_space' IS NULL THEN
    RAISE EXCEPTION 'preferred_space is required';
  END IF;
  
  -- Validate either preferred_date or date_flexible
  IF payload->>'preferred_date' IS NULL AND (payload->>'date_flexible')::boolean IS NOT true THEN
    RAISE EXCEPTION 'Either preferred_date or date_flexible must be provided';
  END IF;
  
  -- Validate headcount if provided
  IF payload->>'headcount' IS NOT NULL AND (payload->>'headcount')::int < 1 THEN
    RAISE EXCEPTION 'headcount must be at least 1';
  END IF;
  
  -- Validate budget range if provided
  IF payload->>'budget_low' IS NOT NULL AND payload->>'budget_high' IS NOT NULL THEN
    IF (payload->>'budget_low')::int < 0 OR (payload->>'budget_high')::int < 0 THEN
      RAISE EXCEPTION 'budget values must be non-negative';
    END IF;
    IF (payload->>'budget_low')::int > (payload->>'budget_high')::int THEN
      RAISE EXCEPTION 'budget_low cannot be greater than budget_high';
    END IF;
  END IF;

  -- Insert the lead
  INSERT INTO public.leads (
    first_name, last_name, email, phone,
    event_type, preferred_space, preferred_date, date_flexible,
    headcount, budget_low, budget_high, message, source, utm
  ) VALUES (
    trim(payload->>'first_name'),
    trim(payload->>'last_name'), 
    trim(payload->>'email'),
    nullif(trim(payload->>'phone'), ''),
    nullif(trim(payload->>'event_type'), ''),
    (payload->>'preferred_space')::uuid,
    nullif(payload->>'preferred_date', '')::date,
    coalesce((payload->>'date_flexible')::boolean, false),
    nullif(payload->>'headcount', '')::int,
    nullif(payload->>'budget_low', '')::int,
    nullif(payload->>'budget_high', '')::int,
    nullif(trim(payload->>'message'), ''),
    nullif(trim(payload->>'source'), ''),
    coalesce(payload->'utm', '{}'::jsonb)
  ) RETURNING id INTO lead_id;

  -- Log audit entry
  PERFORM public.log_audit_entry(
    null, -- No authenticated user for public form
    'INSERT',
    'leads',
    lead_id,
    payload
  );

  -- Add system activity
  INSERT INTO public.lead_activity (lead_id, type, meta)
  VALUES (lead_id, 'system', jsonb_build_object('event', 'created'));

  RETURN lead_id;
END;
$$;

-- RPC: UPDATE LEAD
CREATE OR REPLACE FUNCTION public.update_lead(lead_id_param uuid, patch jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_record jsonb;
  new_record jsonb;
  old_status text;
  new_status text;
BEGIN
  -- Get old record for audit
  SELECT to_jsonb(l.*) INTO old_record FROM public.leads l WHERE id = lead_id_param;
  
  IF old_record IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  old_status := old_record->>'status';

  -- Update the lead
  UPDATE public.leads SET
    status = coalesce(patch->>'status', status),
    owner_id = coalesce(nullif(patch->>'owner_id', '')::uuid, owner_id),
    first_name = coalesce(trim(patch->>'first_name'), first_name),
    last_name = coalesce(trim(patch->>'last_name'), last_name),
    email = coalesce(trim(patch->>'email'), email),
    phone = coalesce(nullif(trim(patch->>'phone'), ''), phone),
    event_type = coalesce(nullif(trim(patch->>'event_type'), ''), event_type),
    preferred_space = coalesce(nullif(patch->>'preferred_space', '')::uuid, preferred_space),
    preferred_date = coalesce(nullif(patch->>'preferred_date', '')::date, preferred_date),
    date_flexible = coalesce((patch->>'date_flexible')::boolean, date_flexible),
    headcount = coalesce(nullif(patch->>'headcount', '')::int, headcount),
    budget_low = coalesce(nullif(patch->>'budget_low', '')::int, budget_low),
    budget_high = coalesce(nullif(patch->>'budget_high', '')::int, budget_high),
    message = coalesce(nullif(trim(patch->>'message'), ''), message)
  WHERE id = lead_id_param;

  -- Get new record for audit
  SELECT to_jsonb(l.*) INTO new_record FROM public.leads l WHERE id = lead_id_param;
  new_status := new_record->>'status';

  -- Log audit entry
  PERFORM public.log_audit_entry(
    auth.uid(),
    'UPDATE',
    'leads',
    lead_id_param,
    jsonb_build_object('old', old_record, 'new', new_record)
  );

  -- Add status change activity if status changed
  IF old_status != new_status THEN
    INSERT INTO public.lead_activity (lead_id, type, author_id, meta)
    VALUES (
      lead_id_param, 
      'status', 
      auth.uid(),
      jsonb_build_object('old_status', old_status, 'new_status', new_status)
    );
  END IF;
END;
$$;

-- RPC: ADD LEAD NOTE
CREATE OR REPLACE FUNCTION public.add_lead_note(lead_id_param uuid, note_body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_id uuid;
BEGIN
  IF trim(note_body) = '' THEN
    RAISE EXCEPTION 'Note body cannot be empty';
  END IF;

  -- Insert activity
  INSERT INTO public.lead_activity (lead_id, type, body, author_id)
  VALUES (lead_id_param, 'note', trim(note_body), auth.uid())
  RETURNING id INTO activity_id;

  -- Log audit entry
  PERFORM public.log_audit_entry(
    auth.uid(),
    'INSERT',
    'lead_activity',
    activity_id,
    jsonb_build_object('lead_id', lead_id_param, 'type', 'note', 'body', trim(note_body))
  );

  RETURN activity_id;
END;
$$;

-- RPC: REASSIGN LEAD
CREATE OR REPLACE FUNCTION public.reassign_lead(lead_id_param uuid, new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_owner_id uuid;
BEGIN
  -- Get current owner
  SELECT owner_id INTO old_owner_id FROM public.leads WHERE id = lead_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- Update owner
  UPDATE public.leads SET owner_id = new_owner_id WHERE id = lead_id_param;

  -- Log audit entry
  PERFORM public.log_audit_entry(
    auth.uid(),
    'UPDATE',
    'leads',
    lead_id_param,
    jsonb_build_object('field', 'owner_id', 'old_value', old_owner_id, 'new_value', new_owner_id)
  );

  -- Add system activity
  INSERT INTO public.lead_activity (lead_id, type, author_id, meta)
  VALUES (
    lead_id_param,
    'system',
    auth.uid(),
    jsonb_build_object('event', 'reassigned', 'old_owner_id', old_owner_id, 'new_owner_id', new_owner_id)
  );
END;
$$;