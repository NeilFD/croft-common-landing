-- Update generate_contract function with comprehensive legal clauses and proper structure
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
  terms_and_conditions TEXT;
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
      
      -- Build line item text
      line_items_content := line_items_content || 
        '• ' || UPPER(item_record.type) || ': ' ||
        line_qty_display || ' × £' || TO_CHAR(COALESCE(item_record.unit_price,0), 'FM999999990.00') ||
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

  -- Comprehensive Terms & Conditions
  terms_and_conditions := E'
TERMS & CONDITIONS

1. DEFINITIONS
In this Agreement:
"Client" means the person(s) or organisation contracting for the event
"Venue" means Croft Common, Unit 1-3, Croft Court, 48 Croft Street, London SE8 4EX
"Event" means the function detailed in this contract
"Agreement" means this contract including these terms and conditions

2. BOOKING & PAYMENT
2.1 This contract becomes binding upon signature by both parties
2.2 A 25% deposit is required within 7 days to secure the booking
2.3 Final balance due 14 days prior to the event date
2.4 Late payment may result in cancellation at the Venue\'s discretion
2.5 All prices include VAT at the current rate unless otherwise stated

3. CANCELLATION & CHANGES
3.1 Cancellation more than 8 weeks: 25% of total contract value
3.2 Cancellation 4-8 weeks: 50% of total contract value  
3.3 Cancellation less than 4 weeks: 100% of total contract value
3.4 Changes to date/time subject to availability and may incur charges
3.5 Reduction in guest numbers less than 7 days before: full payment due

4. VENUE POLICIES
4.1 Minimum spend requirements must be met as detailed above
4.2 Bar service operates under our licence - no external alcohol permitted
4.3 All catering must be provided by or approved by the Venue
4.4 The Venue reserves the right to refuse service to any individual

5. LIABILITY & DAMAGES
5.1 Client is liable for any damage to the premises or equipment
5.2 Venue liability is limited to the total contract value
5.3 Client must have appropriate public liability insurance (minimum £2,000,000)
5.4 The Venue accepts no liability for personal items or vehicles

6. HEALTH & SAFETY
6.1 All decorations must be flame retardant and approved by management
6.2 No fixing of items to walls/ceilings without prior written consent
6.3 Emergency exits must remain clear at all times
6.4 Maximum capacity must not be exceeded

7. LICENSING & CONDUCT  
7.1 Music must cease by 23:30 (11:30 PM) on weekdays, midnight weekends
7.2 All guests must be over 18 unless specifically agreed otherwise
7.3 The Venue operates Challenge 25 and reserves the right to refuse entry
7.4 Disorderly conduct may result in event termination without refund

8. ACCESS & LOGISTICS
8.1 Access times as detailed in the event schedule above
8.2 All deliveries must be pre-arranged with management  
8.3 Client responsible for removal of all personal items and decorations
8.4 Additional cleaning charges may apply for excessive mess

9. FORCE MAJEURE
9.1 Neither party liable for delays/cancellation due to circumstances beyond reasonable control
9.2 This includes but not limited to: pandemic restrictions, fire, flood, strike action
9.3 In such cases, the Venue will endeavour to offer alternative arrangements

10. DATA PROTECTION
10.1 Personal data processed in accordance with UK GDPR
10.2 Data used solely for event management and legitimate business purposes
10.3 Client consents to photography/filming for promotional use unless otherwise specified

11. GENERAL PROVISIONS  
11.1 This Agreement constitutes the entire agreement between parties
11.2 Any variations must be in writing and signed by both parties
11.3 If any provision is unenforceable, the remainder shall remain in full force
11.4 This Agreement is governed by English Law and subject to English Courts
11.5 Disputes will be handled through mediation before legal proceedings

By signing this contract, both parties acknowledge they have read, understood and agree to be bound by these terms and conditions.
';

  -- Create contract content
  contract_content := 
    '═══════════════════════════════════════════════════════════════' || E'\n' ||
    '                            CROFT COMMON                            ' || E'\n' ||
    '                    EVENT SERVICES CONTRACT                    ' || E'\n' ||
    '═══════════════════════════════════════════════════════════════' || E'\n\n' ||
    
    'CONTRACT REF: ' || COALESCE(event_data.code, 'CC-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0')) || E'\n' ||
    'DATE: ' || TO_CHAR(NOW(), 'DD/MM/YYYY') || E'\n\n' ||
    
    '───────────────────────────────────────────────────────────────' || E'\n' ||
    '                         CLIENT DETAILS                         ' || E'\n' ||
    '───────────────────────────────────────────────────────────────' || E'\n' ||
    'CLIENT NAME: ' || COALESCE(event_data.client_name, 'To Be Confirmed') || E'\n' ||
    'COMPANY: ' || company_name || E'\n' ||
    'EMAIL: ' || COALESCE(event_data.client_email, 'Not provided') || E'\n' ||
    'PHONE: ' || COALESCE(event_data.client_phone, 'Not provided') || E'\n\n' ||
    
    '───────────────────────────────────────────────────────────────' || E'\n' ||
    '                         EVENT DETAILS                          ' || E'\n' ||
    '───────────────────────────────────────────────────────────────' || E'\n' ||
    'EVENT TYPE: ' || COALESCE(event_data.event_type, 'Private Event') || E'\n' ||
    'EVENT DATE: ' || COALESCE(TO_CHAR(event_data.primary_date, 'DD/MM/YYYY'), 'To Be Confirmed') || E'\n' ||
    'VENUE: ' || COALESCE(venue_name, 'Croft Common - Main Space') || E'\n' ||
    'GUEST COUNT: ' || COALESCE(event_data.headcount::text, 'To Be Confirmed') || E'\n' ||
    'EVENT CODE: ' || COALESCE(event_data.code, 'To Be Assigned') || E'\n\n' ||
    
    '───────────────────────────────────────────────────────────────' || E'\n' ||
    '                        EVENT SCHEDULE                         ' || E'\n' ||
    '───────────────────────────────────────────────────────────────' || E'\n' ||
    COALESCE(setup_details, 'Setup details to be confirmed') || E'\n\n' ||
    
    '───────────────────────────────────────────────────────────────' || E'\n' ||
    '                     SERVICES & PRICING                        ' || E'\n' ||
    '───────────────────────────────────────────────────────────────' || E'\n' ||
    line_items_content || E'\n' ||
    
    '═══════════════════════════════════════════════════════════════' || E'\n' ||
    '                         FINANCIAL SUMMARY                      ' || E'\n' ||
    '═══════════════════════════════════════════════════════════════' || E'\n' ||
    'Subtotal (Net): £' || TO_CHAR(total_net, 'FM999999990.00') || E'\n' ||
    'VAT (20%): £' || TO_CHAR(total_vat, 'FM999999990.00') || E'\n' ||
    CASE WHEN service_charge > 0 THEN 'Service Charge (' || COALESCE(event_data.service_charge_pct, 0)::text || '%): £' || TO_CHAR(service_charge, 'FM999999990.00') || E'\n' ELSE '' END ||
    '───────────────────────────────────────────────────────────────' || E'\n' ||
    'TOTAL AMOUNT DUE: £' || TO_CHAR(final_total, 'FM999999990.00') || E'\n' ||
    '═══════════════════════════════════════════════════════════════' || E'\n\n' ||
    
    terms_and_conditions || E'\n\n' ||
    
    '═══════════════════════════════════════════════════════════════' || E'\n' ||
    '                           SIGNATURES                           ' || E'\n' ||
    '═══════════════════════════════════════════════════════════════' || E'\n' ||
    'CLIENT SIGNATURE: _________________________ DATE: ____________' || E'\n\n' ||
    'CROFT COMMON SIGNATURE: __________________ DATE: ____________' || E'\n\n' ||
    
    'Contract generated on ' || TO_CHAR(NOW(), 'DD/MM/YYYY') || ' via Croft Common Management System' || E'\n' ||
    'Unit 1-3, Croft Court, 48 Croft Street, London SE8 4EX' || E'\n' ||
    'Email: hello@thehive-hospitality.com | Web: www.croftcommontest.com';

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