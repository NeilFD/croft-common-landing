-- Create log_audit_entry function
CREATE OR REPLACE FUNCTION public.log_audit_entry(
  p_entity_id uuid,
  p_entity text,
  p_action text,
  p_actor_id uuid,
  p_diff jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.audit_log (entity_id, entity, action, actor_id, diff)
  VALUES (p_entity_id, p_entity, p_action, p_actor_id, p_diff)
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Create create_management_event function
CREATE OR REPLACE FUNCTION public.create_management_event(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  event_id uuid;
  event_code text;
  event_counter integer;
BEGIN
  -- Input validation
  IF payload->>'event_type' IS NULL OR LENGTH(TRIM(payload->>'event_type')) = 0 THEN
    RAISE EXCEPTION 'Event type is required';
  END IF;
  
  IF payload->>'headcount' IS NULL OR (payload->>'headcount')::integer <= 0 THEN
    RAISE EXCEPTION 'Valid headcount is required';
  END IF;
  
  -- Generate event code
  -- Get the next counter value for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
  INTO event_counter
  FROM public.management_events
  WHERE code LIKE (EXTRACT(YEAR FROM NOW())::text || '%');
  
  -- Format: YYYY001, YYYY002, etc.
  event_code := EXTRACT(YEAR FROM NOW())::text || LPAD(event_counter::text, 3, '0');
  
  -- Create the event
  INSERT INTO public.management_events (
    code,
    event_type,
    headcount,
    notes,
    owner_id,
    status
  )
  VALUES (
    event_code,
    payload->>'event_type',
    (payload->>'headcount')::integer,
    payload->>'notes',
    COALESCE((payload->>'owner_id')::uuid, auth.uid()),
    'draft'
  )
  RETURNING id INTO event_id;
  
  -- Log audit entry
  PERFORM public.log_audit_entry(
    event_id,
    'management_events',
    'created',
    auth.uid(),
    jsonb_build_object(
      'event_type', payload->>'event_type',
      'headcount', payload->>'headcount',
      'code', event_code
    )
  );
  
  RETURN event_id;
END;
$$;