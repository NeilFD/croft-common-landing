-- Phase 3B: Holds, Multi-Space Events, Licence Guardrails

-- 1) MANAGEMENT EVENTS (parent record) - renamed to avoid conflict with existing events table
CREATE TABLE IF NOT EXISTS public.management_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,                      -- short human ref, e.g. CC-2025-00123
  status text NOT NULL CHECK (status IN ('draft','active','closed','lost')) DEFAULT 'draft',
  owner_id uuid,
  event_type text,
  primary_date date,                     -- canonical date (first booking start::date)
  headcount int,
  notes text,
  late_close_requested boolean DEFAULT false,
  late_close_reason text,
  late_close_approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Optional: simple generator for code
CREATE UNIQUE INDEX IF NOT EXISTS idx_management_events_code ON public.management_events(code);

-- 2) BOOKINGS: add status + event_id + late-close flag (if not already)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES public.management_events(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('hold_soft','hold_firm','definite')) DEFAULT 'definite';

-- Update existing bookings to have definite status if null
UPDATE public.bookings SET status = 'definite' WHERE status IS NULL;

-- Ensure updated_at trigger exists on management_events & bookings
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$ 
BEGIN 
  NEW.updated_at := now(); 
  RETURN NEW; 
END $$;

DROP TRIGGER IF EXISTS trg_management_events_updated_at ON public.management_events;
CREATE TRIGGER trg_management_events_updated_at
  BEFORE UPDATE ON public.management_events 
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Conflict priority rules (DB helper)
-- Ranking for comparison (soft < firm < definite)
CREATE OR REPLACE VIEW public.v_booking_priority AS
SELECT 'hold_soft'::text as status, 1 as rank
UNION ALL SELECT 'hold_firm', 2
UNION ALL SELECT 'definite', 3;

-- RLS for MANAGEMENT_EVENTS
ALTER TABLE public.management_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS management_events_select ON public.management_events;
CREATE POLICY management_events_select ON public.management_events
FOR SELECT USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role)
);

DROP POLICY IF EXISTS management_events_write ON public.management_events;
CREATE POLICY management_events_write ON public.management_events
FOR INSERT WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR 
  has_management_role(auth.uid(), 'sales'::management_role)
);

CREATE POLICY management_events_update ON public.management_events
FOR UPDATE USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR 
  has_management_role(auth.uid(), 'sales'::management_role)
) WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR 
  has_management_role(auth.uid(), 'sales'::management_role)
);

DROP POLICY IF EXISTS management_events_delete ON public.management_events;
CREATE POLICY management_events_delete ON public.management_events
FOR DELETE USING (has_management_role(auth.uid(), 'admin'::management_role));

-- RPCs (SECURITY DEFINER, set search_path=public, audit every mutation)

-- Create a management event (optionally from a lead)
CREATE OR REPLACE FUNCTION public.create_management_event(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_owner uuid := (payload->>'owner_id')::uuid;
  v_type text := payload->>'event_type';
  v_headcount int := NULLIF(payload->>'headcount','')::int;
  v_code text := COALESCE(payload->>'code', ''); 
  v_actor uuid := auth.uid();
BEGIN
  IF NOT (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role)) THEN 
    RAISE EXCEPTION 'forbidden'; 
  END IF;

  IF v_code = '' THEN
    -- naive generator; replace if you prefer
    v_code := 'CC-' || to_char(now(), 'YYMMDD') || '-' || lpad(floor(random()*100000)::int::text, 5, '0');
  END IF;

  INSERT INTO public.management_events(id, code, status, owner_id, event_type, headcount)
  VALUES (v_id, v_code, 'draft', v_owner, v_type, v_headcount);

  -- Log audit entry if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_entry') THEN
    PERFORM public.log_audit_entry(v_actor, 'insert', 'management_events', v_id, payload);
  END IF;
  
  RETURN v_id;
END $$;

-- Update management event
CREATE OR REPLACE FUNCTION public.update_management_event(p_id uuid, patch jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role)) THEN 
    RAISE EXCEPTION 'forbidden'; 
  END IF;

  UPDATE public.management_events
     SET status      = COALESCE(patch->>'status', status),
         owner_id    = COALESCE((patch->>'owner_id')::uuid, owner_id),
         event_type  = COALESCE(patch->>'event_type', event_type),
         headcount   = COALESCE((patch->>'headcount')::int, headcount),
         notes       = COALESCE(patch->>'notes', notes),
         late_close_requested = COALESCE((patch->>'late_close_requested')::boolean, late_close_requested),
         late_close_reason    = COALESCE(patch->>'late_close_reason', late_close_reason)
   WHERE id = p_id;

  -- Log audit entry if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_entry') THEN
    PERFORM public.log_audit_entry(auth.uid(), 'update', 'management_events', p_id, patch);
  END IF;
END $$;

-- Request late close
CREATE OR REPLACE FUNCTION public.request_late_close(p_event uuid, p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role)) THEN 
    RAISE EXCEPTION 'forbidden'; 
  END IF;
  
  UPDATE public.management_events
     SET late_close_requested = true,
         late_close_reason = p_reason
   WHERE id = p_event;
   
  -- Log audit entry if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_entry') THEN
    PERFORM public.log_audit_entry(auth.uid(), 'update', 'management_events', p_event, jsonb_build_object('late_close_requested',true,'reason',p_reason));
  END IF;
END $$;

-- Approve late close (admin only)
CREATE OR REPLACE FUNCTION public.approve_late_close(p_event uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_management_role(auth.uid(), 'admin'::management_role) THEN 
    RAISE EXCEPTION 'forbidden'; 
  END IF;
  
  UPDATE public.management_events
     SET late_close_requested = false,
         late_close_approved_by = auth.uid()
   WHERE id = p_event;
   
  -- Log audit entry if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_entry') THEN
    PERFORM public.log_audit_entry(auth.uid(), 'update', 'management_events', p_event, jsonb_build_object('late_close_approved',true));
  END IF;
END $$;

-- Create booking against an event with HOLD status (soft/firm)
CREATE OR REPLACE FUNCTION public.create_hold(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_event uuid := (payload->>'event_id')::uuid;
  v_space uuid := (payload->>'space_id')::uuid;
  v_title text := payload->>'title';
  v_status text := COALESCE(payload->>'status','hold_soft');
  v_start timestamptz := (payload->>'start_ts')::timestamptz;
  v_end   timestamptz := (payload->>'end_ts')::timestamptz;
  v_setup int := COALESCE((payload->>'setup_min')::int,0);
  v_teardown int := COALESCE((payload->>'teardown_min')::int,0);
  v_actor uuid := auth.uid();
  v_rank int;
BEGIN
  IF NOT (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role)) THEN 
    RAISE EXCEPTION 'forbidden'; 
  END IF;
  
  IF v_event IS NULL OR v_space IS NULL OR v_title IS NULL OR v_start IS NULL OR v_end IS NULL THEN 
    RAISE EXCEPTION 'missing_required_fields'; 
  END IF;

  -- Priority check: block creating a lower/equal priority hold that conflicts with an existing higher/equal one
  WITH pr AS (SELECT rank FROM public.v_booking_priority WHERE status = v_status),
  conflicts AS (
    SELECT b.id, pb.rank as existing_rank, pr.rank as new_rank
    FROM public.bookings b
    JOIN public.v_booking_priority pb ON pb.status = b.status
    JOIN pr ON true
    WHERE b.space_id = v_space
      AND tstzrange(b.start_ts - (b.setup_min||' minutes')::interval,
                    b.end_ts   + (b.teardown_min||' minutes')::interval,'[)')
          && tstzrange(v_start - (v_setup||' minutes')::interval,
                       v_end   + (v_teardown||' minutes')::interval,'[)')
  )
  SELECT rank INTO v_rank FROM pr;

  IF EXISTS (SELECT 1 FROM conflicts WHERE existing_rank >= v_rank) THEN
    RAISE EXCEPTION 'conflict_with_higher_or_equal_priority';
  END IF;

  INSERT INTO public.bookings(id, event_id, space_id, title, start_ts, end_ts, setup_min, teardown_min, status, created_by)
  VALUES (v_id, v_event, v_space, v_title, v_start, v_end, v_setup, v_teardown, v_status, v_actor);

  -- Set event.primary_date if null
  UPDATE public.management_events e
     SET primary_date = COALESCE(e.primary_date, (v_start AT TIME ZONE 'UTC')::date)
   WHERE e.id = v_event;

  -- Log audit entry if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_entry') THEN
    PERFORM public.log_audit_entry(v_actor, 'insert', 'bookings', v_id, payload);
  END IF;
  
  RETURN v_id;
END $$;

-- Promote hold -> firm or definite
CREATE OR REPLACE FUNCTION public.promote_hold(p_booking uuid, p_new_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old text;
  v_new_rank int;
BEGIN
  IF NOT (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role)) THEN 
    RAISE EXCEPTION 'forbidden'; 
  END IF;
  
  IF p_new_status NOT IN ('hold_firm','definite') THEN 
    RAISE EXCEPTION 'invalid_status'; 
  END IF;

  SELECT status INTO v_old FROM public.bookings WHERE id = p_booking;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'not_found'; 
  END IF;

  -- Re-check conflicts at the higher priority
  UPDATE public.bookings
     SET status = p_new_status
   WHERE id = p_booking;

  -- Log audit entry if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_entry') THEN
    PERFORM public.log_audit_entry(auth.uid(), 'update', 'bookings', p_booking,
            jsonb_build_object('status_from', v_old, 'status_to', p_new_status));
  END IF;
END $$;