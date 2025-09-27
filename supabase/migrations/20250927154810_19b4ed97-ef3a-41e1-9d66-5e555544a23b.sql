-- Fix create_lead function to call log_audit_entry with correct parameters
CREATE OR REPLACE FUNCTION public.create_lead(payload jsonb, client_ip text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_lead_id UUID;
  ip_key TEXT;
  rate_allowed BOOLEAN;
  honeypot_check TEXT;
BEGIN
  -- Rate limiting
  IF client_ip IS NOT NULL THEN
    ip_key := 'lead:' || encode(extensions.digest(convert_to(client_ip, 'UTF8'), 'sha256'), 'hex');
    SELECT public.bump_rate_key(ip_key, 10, 3600) INTO rate_allowed;
    IF NOT rate_allowed THEN
      RAISE EXCEPTION 'rate_limit' USING HINT = 'Too many requests from this IP address';
    END IF;
  END IF;

  -- Honeypot check
  honeypot_check := payload->>'website';
  IF honeypot_check IS NOT NULL AND honeypot_check != '' THEN
    RAISE EXCEPTION 'spam_detected' USING HINT = 'Invalid form submission';
  END IF;

  -- Insert lead with only known fields
  INSERT INTO public.leads (
    first_name, last_name, email, phone, event_type,
    preferred_space, preferred_date, date_flexible, headcount,
    budget_low, budget_high, message, source,
    consent_marketing, privacy_accepted_at
  ) VALUES (
    payload->>'first_name',
    payload->>'last_name', 
    payload->>'email',
    payload->>'phone',
    payload->>'event_type',
    (payload->>'preferred_space')::UUID,
    (payload->>'preferred_date')::DATE,
    (payload->>'date_flexible')::BOOLEAN,
    (payload->>'headcount')::INTEGER,
    (payload->>'budget_low')::INTEGER,
    (payload->>'budget_high')::INTEGER,
    payload->>'message',
    COALESCE(payload->>'source', 'enquiry_form'),
    COALESCE((payload->>'consent_marketing')::BOOLEAN, false),
    CASE WHEN (payload->>'privacy_accepted')::BOOLEAN = true THEN now() ELSE NULL END
  ) RETURNING id INTO new_lead_id;

  -- Log audit entry with correct parameter order: action, entity, entity_id, diff
  PERFORM log_audit_entry(
    'INSERT',
    'leads', 
    new_lead_id,
    row_to_json((SELECT d FROM (SELECT first_name, last_name, email, phone, event_type, preferred_space, preferred_date, date_flexible, headcount, budget_low, budget_high, message, source, consent_marketing, privacy_accepted_at FROM public.leads WHERE id = new_lead_id) d))::jsonb
  );

  RETURN new_lead_id;
END;
$$;