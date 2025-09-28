-- Fix promote_hold function parameter name to match UI expectations
DROP FUNCTION IF EXISTS public.promote_hold(uuid, text);

CREATE OR REPLACE FUNCTION public.promote_hold(
  p_booking uuid,
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
  WHERE id = p_booking;

  IF old_status IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Update the booking status
  UPDATE public.bookings
  SET status = p_new_status, updated_at = now()
  WHERE id = p_booking;

  -- Log audit entry with correct parameter order: (entity_id, entity, action, actor_id, diff)
  PERFORM log_audit_entry(
    p_booking,            -- entity_id
    'bookings',           -- entity  
    'status_updated',     -- action
    auth.uid(),           -- actor_id
    jsonb_build_object('title', booking_title, 'old_status', old_status, 'new_status', p_new_status) -- diff
  );
END;
$$;