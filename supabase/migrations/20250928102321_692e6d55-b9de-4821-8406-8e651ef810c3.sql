-- Drop existing function first
DROP FUNCTION IF EXISTS public.create_proposal(uuid, jsonb, numeric);

-- Create management event line items table
CREATE TABLE public.management_event_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.management_events(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  qty INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  per_person BOOLEAN DEFAULT false,
  tax_rate_pct NUMERIC DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.management_event_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies matching event_line_items
CREATE POLICY "management_event_line_items_delete" 
ON public.management_event_line_items 
FOR DELETE 
TO authenticated
USING (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role));

CREATE POLICY "management_event_line_items_insert" 
ON public.management_event_line_items 
FOR INSERT 
TO authenticated
WITH CHECK (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role));

CREATE POLICY "management_event_line_items_select" 
ON public.management_event_line_items 
FOR SELECT 
TO authenticated
USING (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role) OR has_management_role(auth.uid(), 'ops'::management_role) OR has_management_role(auth.uid(), 'finance'::management_role) OR has_management_role(auth.uid(), 'readonly'::management_role));

CREATE POLICY "management_event_line_items_update" 
ON public.management_event_line_items 
FOR UPDATE 
TO authenticated
USING (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role));

-- Add updated_at trigger
CREATE TRIGGER update_management_event_line_items_updated_at
BEFORE UPDATE ON public.management_event_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create new create_proposal function to handle both table types
CREATE OR REPLACE FUNCTION public.create_proposal(
  p_event_id UUID,
  p_line_items JSONB,
  p_service_charge_pct NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  line_item JSONB;
  result_items JSONB := '[]'::jsonb;
  is_management_event BOOLEAN := false;
BEGIN
  -- Check if this is a management event
  SELECT EXISTS(SELECT 1 FROM public.management_events WHERE id = p_event_id) INTO is_management_event;
  
  -- Clear existing line items for this event
  IF is_management_event THEN
    DELETE FROM public.management_event_line_items WHERE event_id = p_event_id;
  ELSE
    DELETE FROM public.event_line_items WHERE event_id = p_event_id;
  END IF;
  
  -- Insert new line items
  FOR line_item IN SELECT * FROM jsonb_array_elements(p_line_items)
  LOOP
    IF is_management_event THEN
      INSERT INTO public.management_event_line_items (
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
        line_item->>'type',
        line_item->>'description',
        (line_item->>'qty')::integer,
        (line_item->>'unit_price')::numeric,
        (line_item->>'per_person')::boolean,
        CASE WHEN line_item->>'tax_rate_pct' = '' THEN NULL ELSE (line_item->>'tax_rate_pct')::numeric END,
        (line_item->>'sort_order')::integer
      );
    ELSE
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
        line_item->>'type',
        line_item->>'description',
        (line_item->>'qty')::integer,
        (line_item->>'unit_price')::numeric,
        (line_item->>'per_person')::boolean,
        CASE WHEN line_item->>'tax_rate_pct' = '' THEN NULL ELSE (line_item->>'tax_rate_pct')::numeric END,
        (line_item->>'sort_order')::integer
      );
    END IF;
  END LOOP;
  
  -- Update service charge percentage on the event
  IF is_management_event THEN
    UPDATE public.management_events 
    SET service_charge_pct = p_service_charge_pct
    WHERE id = p_event_id;
  ELSE
    UPDATE public.events 
    SET service_charge_pct = p_service_charge_pct
    WHERE id = p_event_id;
  END IF;
  
  -- Return success with line items count
  SELECT jsonb_build_object(
    'success', true,
    'message', 'Proposal saved successfully',
    'line_items_count', jsonb_array_length(p_line_items),
    'service_charge_pct', p_service_charge_pct
  ) INTO result_items;
  
  RETURN result_items;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'details', SQLSTATE
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_proposal(uuid, jsonb, numeric) TO anon, authenticated;