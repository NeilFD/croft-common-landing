-- Enhanced comprehensive contract generation function with detailed content, branding, and legal clauses
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
BEGIN
  -- Get event data from management_events table
  SELECT * INTO event_data FROM public.management_events WHERE id = p_event_id;
  
  IF event_data IS NULL THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Get venue name and setup details from bookings
  SELECT 
    s.name,
    CONCAT(
      'Setup: ', b.setup_min, ' mins | ',
      'Event: ', TO_CHAR(b.start_ts, 'HH24:MI'), '-', TO_CHAR(b.end_ts, 'HH24:MI'), ' | ',
      'Teardown: ', b.teardown_min, ' mins'
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
    BEGIN
      -- Calculate quantities (per person or absolute)
      line_qty := CASE WHEN item_record.per_person THEN item_record.qty * COALESCE(event_data.headcount, 1) ELSE item_record.qty END;
      
      -- Calculate line totals (unit_price is gross/VAT-inclusive)
      line_total := line_qty * item_record.unit_price;
      line_net := ROUND(line_total / 1.2, 2);  -- Remove 20% VAT to get net
      line_vat := line_total - line_net;
      
      -- Add to running totals
      total_net := total_net + line_net;
      total_vat := total_vat + line_vat;
      total_gross := total_gross + line_total;
      
      -- Build line item text
      line_items_content := line_items_content || format(
        '• %s: %s x £%.2f = £%.2f%s' || E'\n',
        UPPER(item_record.type),
        CASE WHEN item_record.per_person THEN format('%s people', line_qty) ELSE line_qty::text END,
        item_record.unit_price,
        line_total,
        CASE WHEN item_record.per_person THEN ' (per person)' ELSE '' END
      );
    END;
  END LOOP;

  -- Calculate service charge if any (typically 0% for management events)
  service_charge := total_gross * 0.00;  -- No service charge for management events
  final_total := total_gross + service_charge;

  -- If no line items, use default room hire
  IF line_items_content = '' THEN
    line_items_content := '• ROOM HIRE: Event Space = £600.00' || E'\n';
    total_net := 500.00;
    total_vat := 100.00;
    total_gross := 600.00;
    final_total := 600.00;
  END IF;

  -- Create comprehensive contract content
  contract_content := format('
═══════════════════════════════════════════════════════════════════════════════
                               CROFT COMMON
                            EVENT SERVICES CONTRACT
═══════════════════════════════════════════════════════════════════════════════

CONTRACT REFERENCE: %s
DATE: %s

───────────────────────────────────────────────────────────────────────────────
                              CLIENT DETAILS
───────────────────────────────────────────────────────────────────────────────

Client Name:        %s
Company:           %s
Contact Email:     %s
Contact Phone:     %s

───────────────────────────────────────────────────────────────────────────────
                              EVENT DETAILS
───────────────────────────────────────────────────────────────────────────────

Event Type:        %s
Event Date:        %s
Venue:             %s
Guest Count:       %s
Event Code:        %s

%s

───────────────────────────────────────────────────────────────────────────────
                           SERVICES & PRICING
───────────────────────────────────────────────────────────────────────────────

%s
                                                           ──────────────────
Subtotal (Net):                                                    £%.2f
VAT (20%%):                                                         £%.2f
                                                           ──────────────────
TOTAL AMOUNT:                                                      £%.2f

───────────────────────────────────────────────────────────────────────────────
                             PAYMENT TERMS
───────────────────────────────────────────────────────────────────────────────

• DEPOSIT: 50%% of total amount (£%.2f) required to confirm booking
• BALANCE: Remaining amount (£%.2f) due 7 days before event date
• DAMAGE DEPOSIT: 25%% of function value (£%.2f) pre-authorised on event day
• Payment methods: Bank transfer, card payment
• Late payment fee: 2%% per month on overdue amounts

───────────────────────────────────────────────────────────────────────────────
                        TERMS AND CONDITIONS
───────────────────────────────────────────────────────────────────────────────

1. BOOKING CONFIRMATION
   This contract becomes binding upon receipt of signed contract and deposit 
   payment. All bookings are subject to availability and these terms.

2. CANCELLATION POLICY
   • More than 14 days: Full refund minus 10%% administration fee
   • 7-14 days: 50%% refund of deposit
   • Less than 7 days: No refund
   • Force majeure events: Rescheduling options available

3. CLIENT RESPONSIBILITIES
   • Provide accurate guest numbers 72 hours before event
   • Ensure guests comply with venue rules and licensing conditions
   • Responsible for behaviour of all attendees
   • Must have public liability insurance for events over 100 people

4. VENUE ACCESS & SETUP
   • Access times as specified in booking schedule
   • Client responsible for removing all personal items post-event
   • Additional cleaning charges apply for excessive mess: £150-£500

5. EQUIPMENT & DAMAGE
   • Client liable for damage to venue, furniture, or equipment
   • Damage deposit held as security and released within 7 days if no claims
   • Replacement costs charged at current market rates
   • Smoking prohibited throughout venue (£500 fine per incident)

6. HEALTH & SAFETY
   • Maximum capacity limits must be observed at all times
   • Fire exits must remain unobstructed
   • No naked flames without prior written consent
   • Client must provide risk assessment for events over 150 people

7. ALCOHOL SERVICE
   • Licensed premises - no external alcohol permitted
   • Service ceases 30 minutes before event end time
   • Management reserves right to refuse service
   • Client responsible for compliance with licensing laws

8. LIABILITY & INSURANCE
   • Croft Common liability limited to contract value
   • Client indemnifies venue against third-party claims
   • Personal belongings left at own risk
   • Comprehensive public liability insurance in place

9. FORCE MAJEURE
   Events beyond reasonable control (pandemic, extreme weather, government 
   restrictions) may result in postponement. Alternative dates offered within 
   12 months or pro-rata refund after costs.

10. DATA PROTECTION
    Personal data processed in accordance with GDPR and our Privacy Policy.
    Marketing communications opt-out available at any time.

───────────────────────────────────────────────────────────────────────────────
                             CONTRACT EXECUTION
───────────────────────────────────────────────────────────────────────────────

By signing below, both parties agree to be bound by the terms of this contract.

CLIENT SIGNATURE:

Signed: ________________________________    Date: ______________

Print Name: _____________________________

Position: _______________________________


CROFT COMMON:

Signed: ________________________________    Date: ______________

Print Name: _____________________________

Position: Authorised Representative


───────────────────────────────────────────────────────────────────────────────

CROFT COMMON
Business Address: [Address to be added]
Company Registration: [Number to be added]
VAT Registration: [Number to be added]
Contact: events@croftcommontest.com
Website: www.croftcommontest.com

This contract is governed by English Law.

═══════════════════════════════════════════════════════════════════════════════
', 
    -- Parameters for format function
    COALESCE(event_data.code, 'CC-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0')),
    TO_CHAR(NOW(), 'DD/MM/YYYY'),
    COALESCE(event_data.client_name, 'To Be Confirmed'),
    COALESCE(event_data.company, 'Private Client'),
    COALESCE(event_data.client_email, 'Not provided'),
    COALESCE(event_data.client_phone, 'Not provided'),
    COALESCE(event_data.event_type, 'Private Event'),
    COALESCE(event_data.primary_date::text, 'To Be Confirmed'),
    COALESCE(venue_name, 'Croft Common - Main Space'),
    COALESCE(event_data.headcount::text, 'To Be Confirmed'),
    COALESCE(event_data.code, 'To Be Assigned'),
    COALESCE(setup_details, 'Setup details to be confirmed'),
    line_items_content,
    total_net,
    total_vat,
    final_total,
    ROUND(final_total * 0.50, 2),  -- 50% deposit
    ROUND(final_total * 0.50, 2),  -- 50% balance
    ROUND(final_total * 0.25, 2)   -- 25% damage deposit
  );

  -- Insert contract
  INSERT INTO public.contracts (event_id, content, version)
  VALUES (p_event_id, contract_content, 1)
  RETURNING id INTO contract_id;

  -- Log audit entry
  PERFORM public.log_audit_entry(p_event_id, 'management_events', 'contract_generated', auth.uid(), 
    jsonb_build_object(
      'contract_id', contract_id,
      'total_amount', final_total,
      'deposit_amount', ROUND(final_total * 0.50, 2),
      'damage_deposit', ROUND(final_total * 0.25, 2)
    ));

  RETURN contract_id;
END;
$$;