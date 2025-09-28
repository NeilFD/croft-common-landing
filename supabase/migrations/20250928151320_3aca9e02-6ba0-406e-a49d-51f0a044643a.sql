-- Fix generate_contract function to work with management_events table
CREATE OR REPLACE FUNCTION public.generate_contract(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_id UUID;
  event_data RECORD;
  contract_content TEXT;
BEGIN
  -- Get event data from management_events table
  SELECT * INTO event_data FROM public.management_events WHERE id = p_event_id;
  
  IF event_data IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Create contract template using correct field names
  contract_content := format('
CROFT COMMON EVENT CONTRACT

Client: %s
Event Date: %s
Event Type: %s
Location: %s
Event Code: %s

This contract confirms the booking of the above event.

Terms and Conditions:
- Full payment required 7 days before event
- Cancellation policy applies
- Equipment and setup as specified

Signed: _________________________ Date: _____________

', 
    COALESCE(event_data.client_name, 'Not specified'),
    COALESCE(event_data.event_date::text, 'Not specified'),
    COALESCE(event_data.event_type, 'Not specified'),
    COALESCE(event_data.venue_name, 'Not specified'),
    COALESCE(event_data.code, 'Not specified')
  );

  -- Insert contract
  INSERT INTO public.contracts (event_id, content, version)
  VALUES (p_event_id, contract_content, 1)
  RETURNING id INTO contract_id;

  -- Log audit entry
  PERFORM public.log_audit_entry(p_event_id, 'event', 'contract_generated', auth.uid(), 
    jsonb_build_object('contract_id', contract_id));

  RETURN contract_id;
END;
$$;