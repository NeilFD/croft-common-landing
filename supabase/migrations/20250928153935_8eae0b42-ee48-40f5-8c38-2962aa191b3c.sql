-- Fix numeric formatting issues in generate_contract function
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
  setup_details TEXT;
  line_items_content TEXT := '';
  total_net NUMERIC := 0;
  total_vat NUMERIC := 0;
  total_gross NUMERIC := 0;
  service_charge NUMERIC := 0;
  final_total NUMERIC := 0;
  contract_content TEXT;
  item_record RECORD;
  company_name TEXT := 'Private Client';
BEGIN
  -- Get event data from management_events table
  SELECT * INTO event_data FROM public.management_events WHERE id = p_event_id;
  
  IF event_data IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Resolve company/client display name
  company_name := COALESCE(event_data.client_name, 'Private Client');

  -- Get venue name and setup details from bookings
  SELECT 
    s.name,
    CONCAT(
      'Setup: ', COALESCE(b.setup_min,0)::text, ' mins | ',
      'Event: ', TO_CHAR(b.start_ts, 'HH24:MI'), '-', TO_CHAR(b.end_ts, 'HH24:MI'), ' | ',
      'Teardown: ', COALESCE(b.teardown_min,0)::text, ' mins'
    ) as setup_info
  INTO venue_name, setup_details
  FROM public.bookings b
  JOIN public.spaces s ON s.id = b.space_id
  WHERE b.event_id = p_event_id
  ORDER BY b.created_at ASC
  LIMIT 1;

  -- Build line items content and calculate totals
  FOR item_record IN 
    SELECT * FROM public.event_line_items 
    WHERE event_id = p_event_id 
    ORDER BY sort_order
  LOOP
    DECLARE
      line_net NUMERIC;
      line_vat NUMERIC;
      line_total NUMERIC;
      line_qty NUMERIC;
      line_qty_display TEXT;
      vat_rate NUMERIC := COALESCE(item_record.tax_rate_pct, 20) / 100.0;
    BEGIN
      -- Calculate quantities (per person or absolute)
      line_qty := CASE WHEN item_record.per_person THEN COALESCE(item_record.qty,1) * COALESCE(event_data.headcount, 1) ELSE COALESCE(item_record.qty,1) END;
      
      -- Create display text for quantity - use trunc to avoid decimals
      line_qty_display := CASE 
        WHEN item_record.per_person THEN TRUNC(line_qty)::text || ' people'
        ELSE TRUNC(line_qty)::text
      END;
      
      -- Calculate line totals assuming unit_price is VAT-inclusive
      line_total := line_qty * COALESCE(item_record.unit_price, 0);
      line_net := line_total / (1 + vat_rate);
      line_vat := line_total - line_net;
      
      -- Add to running totals
      total_net := total_net + line_net;
      total_vat := total_vat + line_vat;
      total_gross := total_gross + line_total;
      
      -- Build line item text using simple concatenation - convert to money format first
      line_items_content := line_items_content || 
        '• ' || UPPER(item_record.type) || ': ' ||
        line_qty_display || ' x £' || TO_CHAR(COALESCE(item_record.unit_price,0), 'FM999999990.00') ||
        ' = £' || TO_CHAR(line_total, 'FM999999990.00') ||
        CASE WHEN item_record.per_person THEN ' (per person)' ELSE '' END || E'\n';
    END;
  END LOOP;

  -- Calculate service charge
  service_charge := COALESCE(event_data.service_charge_pct, 0) / 100.0 * total_gross;
  final_total := total_gross + service_charge;

  -- If no line items, set default room hire
  IF line_items_content = '' THEN
    line_items_content := '• ROOM HIRE: Event Space = £600.00' || E'\n';
    total_net := 500.00;
    total_vat := 100.00;
    total_gross := 600.00;
    final_total := 600.00 + COALESCE(event_data.service_charge_pct,0) / 100.0 * 600.00;
  END IF;

  -- Create contract content using TO_CHAR for all numeric formatting
  contract_content := 
    'CONTRACT REF: ' || COALESCE(event_data.code, 'CC-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0')) || E'\n' ||
    'DATE: ' || TO_CHAR(NOW(), 'DD/MM/YYYY') || E'\n\n' ||
    'CLIENT NAME: ' || COALESCE(event_data.client_name, 'To Be Confirmed') || E'\n' ||
    'COMPANY: ' || company_name || E'\n' ||
    'EMAIL: ' || COALESCE(event_data.client_email, 'Not provided') || E'\n' ||
    'PHONE: ' || COALESCE(event_data.client_phone, 'Not provided') || E'\n\n' ||
    'EVENT TYPE: ' || COALESCE(event_data.event_type, 'Private Event') || E'\n' ||
    'EVENT DATE: ' || COALESCE(event_data.primary_date::text, 'To Be Confirmed') || E'\n' ||
    'VENUE: ' || COALESCE(venue_name, 'Croft Common - Main Space') || E'\n' ||
    'GUEST COUNT: ' || COALESCE(event_data.headcount::text, 'To Be Confirmed') || E'\n' ||
    'EVENT CODE: ' || COALESCE(event_data.code, 'To Be Assigned') || E'\n\n' ||
    'SETUP: ' || COALESCE(setup_details, 'Setup details to be confirmed') || E'\n\n' ||
    'SERVICES & PRICING' || E'\n' ||
    line_items_content ||
    'Subtotal (Net): £' || TO_CHAR(total_net, 'FM999999990.00') || E'\n' ||
    'VAT: £' || TO_CHAR(total_vat, 'FM999999990.00') || E'\n' ||
    'Service Charge: £' || TO_CHAR(service_charge, 'FM999999990.00') || E'\n' ||
    'TOTAL: £' || TO_CHAR(final_total, 'FM999999990.00') || E'\n';

  -- Insert new contract row
  INSERT INTO public.contracts (event_id, content, version)
  VALUES (p_event_id, contract_content, 1)
  RETURNING id INTO contract_id;

  -- Audit
  PERFORM public.log_audit_entry(p_event_id, 'management_events', 'contract_generated', auth.uid(), 
    jsonb_build_object('contract_id', contract_id, 'total_amount', final_total));

  RETURN contract_id;
END;
$$;