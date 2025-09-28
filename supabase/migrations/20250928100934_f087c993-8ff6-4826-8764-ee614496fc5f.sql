-- Add global service charge percentage to events
ALTER TABLE public.events 
ADD COLUMN service_charge_pct numeric DEFAULT 0;

-- Add global service charge percentage to management_events if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'management_events' AND table_schema = 'public') THEN
    ALTER TABLE public.management_events 
    ADD COLUMN service_charge_pct numeric DEFAULT 0;
  END IF;
END $$;

-- Remove service_charge_pct from individual line items as it's now global
ALTER TABLE public.event_line_items 
DROP COLUMN IF EXISTS service_charge_pct;

-- Update the create_proposal function to handle global service charge
CREATE OR REPLACE FUNCTION public.create_proposal(
  p_event_id UUID,
  p_items JSONB,
  p_service_charge_pct NUMERIC DEFAULT 0
)
RETURNS TABLE(proposal_id UUID, line_items_created INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  items_count INTEGER := 0;
  result_id UUID;
  event_table_name TEXT;
BEGIN
  -- Determine which table to use and check if event exists
  IF EXISTS (SELECT 1 FROM public.management_events WHERE id = p_event_id) THEN
    event_table_name := 'management_events';
  ELSIF EXISTS (SELECT 1 FROM public.events WHERE id = p_event_id) THEN
    event_table_name := 'events';
  ELSE
    RAISE EXCEPTION 'Event not found or access denied';
  END IF;
  
  -- Update the event with global service charge percentage
  IF event_table_name = 'management_events' THEN
    UPDATE public.management_events 
    SET service_charge_pct = p_service_charge_pct
    WHERE id = p_event_id;
  ELSE
    UPDATE public.events 
    SET service_charge_pct = p_service_charge_pct
    WHERE id = p_event_id;
  END IF;
  
  -- Delete existing items for this event to replace them
  DELETE FROM public.event_line_items WHERE event_id = p_event_id;
  
  -- Insert new line items (without individual service charges)
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.event_line_items (
      event_id,
      type,
      description,
      qty,
      unit_price,
      per_person,
      tax_rate_pct,
      sort_order
    ) VALUES (
      p_event_id,
      (item.value->>'type')::text,
      (item.value->>'description')::text,
      (item.value->>'qty')::integer,
      (item.value->>'unit_price')::numeric,
      (item.value->>'per_person')::boolean,
      CASE WHEN item.value->>'tax_rate_pct' IS NOT NULL THEN (item.value->>'tax_rate_pct')::numeric ELSE NULL END,
      (item.value->>'sort_order')::integer
    );
    
    items_count := items_count + 1;
  END LOOP;
  
  result_id := p_event_id;
  
  RETURN QUERY SELECT result_id, items_count;
END;
$$;