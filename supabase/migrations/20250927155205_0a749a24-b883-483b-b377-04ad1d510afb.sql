-- Fix audit logging calls to use correct signature of log_audit_entry(action text, entity text, entity_id uuid, diff jsonb)

-- update_lead
CREATE OR REPLACE FUNCTION public.update_lead(lead_id_param uuid, patch jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_record jsonb;
  new_record jsonb;
  old_status text;
  new_status text;
BEGIN
  -- Get old record for audit
  SELECT to_jsonb(l.*) INTO old_record FROM public.leads l WHERE id = lead_id_param;
  
  IF old_record IS NULL THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  old_status := old_record->>'status';

  -- Update the lead
  UPDATE public.leads SET
    status = coalesce(patch->>'status', status),
    owner_id = coalesce(nullif(patch->>'owner_id', '')::uuid, owner_id),
    first_name = coalesce(trim(patch->>'first_name'), first_name),
    last_name = coalesce(trim(patch->>'last_name'), last_name),
    email = coalesce(trim(patch->>'email'), email),
    phone = coalesce(nullif(trim(patch->>'phone'), ''), phone),
    event_type = coalesce(nullif(trim(patch->>'event_type'), ''), event_type),
    preferred_space = coalesce(nullif(patch->>'preferred_space', '')::uuid, preferred_space),
    preferred_date = coalesce(nullif(patch->>'preferred_date', '')::date, preferred_date),
    date_flexible = coalesce((patch->>'date_flexible')::boolean, date_flexible),
    headcount = coalesce(nullif(patch->>'headcount', '')::int, headcount),
    budget_low = coalesce(nullif(patch->>'budget_low', '')::int, budget_low),
    budget_high = coalesce(nullif(patch->>'budget_high', '')::int, budget_high),
    message = coalesce(nullif(trim(patch->>'message'), ''), message)
  WHERE id = lead_id_param;

  -- Get new record for audit
  SELECT to_jsonb(l.*) INTO new_record FROM public.leads l WHERE id = lead_id_param;
  new_status := new_record->>'status';

  -- Correct audit entry
  PERFORM public.log_audit_entry(
    'UPDATE',
    'leads',
    lead_id_param,
    jsonb_build_object('old', old_record, 'new', new_record)
  );

  -- Add status change activity if status changed
  IF old_status != new_status THEN
    INSERT INTO public.lead_activity (lead_id, type, author_id, meta)
    VALUES (
      lead_id_param, 
      'status', 
      auth.uid(),
      jsonb_build_object('old_status', old_status, 'new_status', new_status)
    );
  END IF;
END;
$$;

-- reassign_lead
CREATE OR REPLACE FUNCTION public.reassign_lead(lead_id_param uuid, new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_owner_id uuid;
BEGIN
  -- Get current owner
  SELECT owner_id INTO old_owner_id FROM public.leads WHERE id = lead_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;

  -- Update owner
  UPDATE public.leads SET owner_id = new_owner_id WHERE id = lead_id_param;

  -- Correct audit entry
  PERFORM public.log_audit_entry(
    'UPDATE',
    'leads',
    lead_id_param,
    jsonb_build_object('field', 'owner_id', 'old_value', old_owner_id, 'new_value', new_owner_id)
  );

  -- Add system activity
  INSERT INTO public.lead_activity (lead_id, type, author_id, meta)
  VALUES (
    lead_id_param,
    'system',
    auth.uid(),
    jsonb_build_object('event', 'reassigned', 'old_owner_id', old_owner_id, 'new_owner_id', new_owner_id)
  );
END;
$$;

-- add_lead_note
CREATE OR REPLACE FUNCTION public.add_lead_note(lead_id_param uuid, note_body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  activity_id uuid;
BEGIN
  IF trim(note_body) = '' THEN
    RAISE EXCEPTION 'Note body cannot be empty';
  END IF;

  -- Insert activity
  INSERT INTO public.lead_activity (lead_id, type, body, author_id)
  VALUES (lead_id_param, 'note', trim(note_body), auth.uid())
  RETURNING id INTO activity_id;

  -- Correct audit entry
  PERFORM public.log_audit_entry(
    'INSERT',
    'lead_activity',
    activity_id,
    jsonb_build_object('lead_id', lead_id_param, 'type', 'note', 'body', trim(note_body))
  );

  RETURN activity_id;
END;
$$;