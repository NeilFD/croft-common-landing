-- Drop and recreate functions to fix parameter order for audit logging

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.update_management_event(uuid, jsonb);
DROP FUNCTION IF EXISTS public.promote_hold(uuid, text);

-- Recreate update_management_event function
CREATE OR REPLACE FUNCTION public.update_management_event(
  p_id uuid,
  patch jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_record jsonb;
  new_record jsonb;
BEGIN
  -- Get current record
  SELECT to_jsonb(me.*) INTO old_record
  FROM public.management_events me
  WHERE id = p_id;

  IF old_record IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Update the record with supported fields
  UPDATE public.management_events 
  SET 
    status = COALESCE(patch->>'status', status),
    event_type = COALESCE(patch->>'event_type', event_type),
    headcount = CASE WHEN patch ? 'headcount' THEN (patch->>'headcount')::integer ELSE headcount END,
    notes = COALESCE(patch->>'notes', notes),
    updated_at = now()
  WHERE id = p_id;

  -- Get updated record  
  SELECT to_jsonb(me.*) INTO new_record
  FROM public.management_events me
  WHERE id = p_id;

  -- Log audit entry with CORRECT parameter order: (entity_id, entity, action, actor_id, diff)
  PERFORM log_audit_entry(
    p_id,                 -- entity_id
    'management_events',  -- entity
    'updated',            -- action
    auth.uid(),           -- actor_id
    jsonb_build_object('old', old_record, 'new', new_record, 'patch', patch) -- diff
  );
END;
$$;

-- Recreate promote_hold function
CREATE OR REPLACE FUNCTION public.promote_hold(
  p_booking_id uuid,
  p_new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_status text;
  booking_title text;
BEGIN
  -- Get current status and title
  SELECT status, title INTO old_status, booking_title
  FROM public.bookings
  WHERE id = p_booking_id;

  IF old_status IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Update the booking status
  UPDATE public.bookings
  SET status = p_new_status, updated_at = now()
  WHERE id = p_booking_id;

  -- Log audit entry with CORRECT parameter order: (entity_id, entity, action, actor_id, diff)
  PERFORM log_audit_entry(
    p_booking_id,         -- entity_id
    'bookings',           -- entity  
    'status_updated',     -- action
    auth.uid(),           -- actor_id
    jsonb_build_object('title', booking_title, 'old_status', old_status, 'new_status', p_new_status) -- diff
  );
END;
$$;