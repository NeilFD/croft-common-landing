-- Add client contact fields to management_events table
ALTER TABLE public.management_events 
ADD COLUMN client_name TEXT,
ADD COLUMN client_email TEXT,
ADD COLUMN client_phone TEXT,
ADD COLUMN budget NUMERIC;

-- Update the create_management_event RPC function to handle new fields
CREATE OR REPLACE FUNCTION public.create_management_event(
  p_event_type TEXT,
  p_headcount INTEGER,
  p_notes TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_start_time TIME DEFAULT NULL,
  p_budget NUMERIC DEFAULT NULL,
  p_client_name TEXT DEFAULT NULL,
  p_client_email TEXT DEFAULT NULL,
  p_client_phone TEXT DEFAULT NULL,
  p_lead_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  event_id UUID;
  event_code TEXT;
BEGIN
  -- Generate unique event code
  event_code := 'EVT-' || 
    substr(upper(md5(random()::text)), 1, 4) || '-' ||
    substr(upper(md5(random()::text)), 1, 4);
  
  -- Insert the new event
  INSERT INTO public.management_events (
    event_code,
    event_type,
    headcount,
    notes,
    start_date,
    start_time,
    budget,
    client_name,
    client_email,
    client_phone,
    lead_id,
    created_by
  ) VALUES (
    event_code,
    p_event_type,
    p_headcount,
    p_notes,
    p_start_date,
    p_start_time,
    p_budget,
    p_client_name,
    p_client_email,
    p_client_phone,
    p_lead_id,
    auth.uid()
  ) RETURNING id INTO event_id;
  
  -- Log audit entry
  PERFORM public.log_audit_entry(
    event_id,
    'management_event',
    'created',
    auth.uid(),
    jsonb_build_object(
      'event_type', p_event_type,
      'headcount', p_headcount,
      'client_name', p_client_name
    )
  );
  
  RETURN event_id;
END;
$$;