-- Fix generate_contract function and database schema alignment
-- Update generate_contract function to use correct field names and get venue from bookings
CREATE OR REPLACE FUNCTION public.generate_contract(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  contract_id UUID;
  event_data RECORD;
  venue_name TEXT;
  contract_content TEXT;
BEGIN
  -- Get event data from management_events table
  SELECT * INTO event_data FROM public.management_events WHERE id = p_event_id;
  
  IF event_data IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Get venue name from the first booked space
  SELECT s.name INTO venue_name
  FROM public.bookings b
  JOIN public.spaces s ON s.id = b.space_id
  WHERE b.event_id = p_event_id
  ORDER BY b.created_at ASC
  LIMIT 1;

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
    COALESCE(event_data.primary_date::text, 'Not specified'),
    COALESCE(event_data.event_type, 'Not specified'),
    COALESCE(venue_name, 'Not specified'),
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

-- Update foreign key constraints to reference management_events instead of events
-- First drop existing foreign keys
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_event_id_fkey;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_event_id_fkey;
ALTER TABLE public.event_line_items DROP CONSTRAINT IF EXISTS event_line_items_event_id_fkey;

-- Add new foreign keys referencing management_events
ALTER TABLE public.contracts 
ADD CONSTRAINT contracts_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.management_events(id) ON DELETE CASCADE;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.management_events(id) ON DELETE CASCADE;

ALTER TABLE public.event_line_items 
ADD CONSTRAINT event_line_items_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.management_events(id) ON DELETE CASCADE;