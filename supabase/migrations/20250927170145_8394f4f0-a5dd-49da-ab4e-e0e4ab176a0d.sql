-- Phase 3 Hardening: Complete RLS and policies setup

-- RLS policies on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin and sales can manage bookings" ON public.bookings;
DROP POLICY IF EXISTS "All roles can view bookings" ON public.bookings;
DROP POLICY IF EXISTS bookings_select ON public.bookings;
DROP POLICY IF EXISTS bookings_write ON public.bookings;
DROP POLICY IF EXISTS bookings_update ON public.bookings;
DROP POLICY IF EXISTS bookings_delete ON public.bookings;

-- New RLS policies
CREATE POLICY bookings_select ON public.bookings
FOR SELECT USING (
  has_management_role(auth.uid(), 'admin'::management_role)
  OR has_management_role(auth.uid(), 'sales'::management_role)
  OR has_management_role(auth.uid(), 'ops'::management_role)
  OR has_management_role(auth.uid(), 'finance'::management_role)
  OR has_management_role(auth.uid(), 'readonly'::management_role)
);

CREATE POLICY bookings_insert ON public.bookings
FOR INSERT WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) 
  OR has_management_role(auth.uid(), 'sales'::management_role)
);

CREATE POLICY bookings_update ON public.bookings
FOR UPDATE USING (
  has_management_role(auth.uid(), 'admin'::management_role) 
  OR has_management_role(auth.uid(), 'sales'::management_role)
) WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) 
  OR has_management_role(auth.uid(), 'sales'::management_role)
);

CREATE POLICY bookings_delete ON public.bookings
FOR DELETE USING (
  has_management_role(auth.uid(), 'admin'::management_role)
);

-- Lead to booking conversion safety
CREATE OR REPLACE FUNCTION public.update_lead_on_booking_creation()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process if booking has a lead_id and status is definite
  IF NEW.lead_id IS NULL OR NEW.status != 'definite' THEN 
    RETURN NEW; 
  END IF;

  -- Update lead status (only if not already lost)
  UPDATE public.leads
     SET status = CASE WHEN status <> 'lost' THEN 'won' ELSE status END,
         updated_at = now()
   WHERE id = NEW.lead_id;

  -- Add system activity only if not exists for this booking (idempotent)
  INSERT INTO public.lead_activity(lead_id, type, body, author_id, meta)
  SELECT NEW.lead_id, 'system', 'Converted to booking', NULL,
         jsonb_build_object('event','converted_to_booking','booking_id',NEW.id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.lead_activity
     WHERE lead_id = NEW.lead_id
       AND meta->>'booking_id' = NEW.id::text
  );

  RETURN NEW;
END $$;

-- Apply the lead conversion trigger
DROP TRIGGER IF EXISTS trg_update_lead_on_booking ON public.bookings;
CREATE TRIGGER trg_update_lead_on_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.update_lead_on_booking_creation();

-- Audit immutability - prevent updates/deletes on audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_update ON public.audit_log;
CREATE POLICY audit_update ON public.audit_log 
FOR UPDATE USING (false);

DROP POLICY IF EXISTS audit_delete ON public.audit_log;
CREATE POLICY audit_delete ON public.audit_log 
FOR DELETE USING (false);

-- Ensure audit log insert policy exists
DROP POLICY IF EXISTS audit_insert ON public.audit_log;
CREATE POLICY audit_insert ON public.audit_log 
FOR INSERT WITH CHECK (true);

-- Simple overlap check function (without complex time ranges for now)
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for overlapping bookings in the same space
  IF EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.space_id = NEW.space_id
      AND b.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND (
        (NEW.start_ts, NEW.end_ts) OVERLAPS (b.start_ts, b.end_ts)
      )
  ) THEN
    RAISE EXCEPTION 'Booking overlaps with existing booking in the same space' 
      USING ERRCODE = 'exclusion_violation';
  END IF;
  
  RETURN NEW;
END $$;

-- Apply overlap check trigger
DROP TRIGGER IF EXISTS trg_check_booking_overlap ON public.bookings;
CREATE TRIGGER trg_check_booking_overlap
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.check_booking_overlap();