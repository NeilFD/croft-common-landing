-- Update the create_proposal function to use the correct event table
CREATE OR REPLACE FUNCTION public.create_proposal(
  p_event_id UUID,
  p_items JSONB
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
BEGIN
  -- Check if event exists in management_events table first, then fallback to events table
  IF NOT EXISTS (
    SELECT 1 FROM public.management_events WHERE id = p_event_id
    UNION
    SELECT 1 FROM public.events WHERE id = p_event_id
  ) THEN
    RAISE EXCEPTION 'Event not found or access denied';
  END IF;
  
  -- Delete existing items for this event to replace them
  DELETE FROM public.event_line_items WHERE event_id = p_event_id;
  
  -- Insert new line items
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
      service_charge_pct,
      sort_order
    ) VALUES (
      p_event_id,
      (item.value->>'type')::text,
      (item.value->>'description')::text,
      (item.value->>'qty')::integer,
      (item.value->>'unit_price')::numeric,
      (item.value->>'per_person')::boolean,
      CASE WHEN item.value->>'tax_rate_pct' IS NOT NULL THEN (item.value->>'tax_rate_pct')::numeric ELSE NULL END,
      CASE WHEN item.value->>'service_charge_pct' IS NOT NULL THEN (item.value->>'service_charge_pct')::numeric ELSE NULL END,
      (item.value->>'sort_order')::integer
    );
    
    items_count := items_count + 1;
  END LOOP;
  
  -- Return a unique ID for the proposal (could be the event_id or generate a new one)
  result_id := p_event_id;
  
  RETURN QUERY SELECT result_id, items_count;
END;
$$;