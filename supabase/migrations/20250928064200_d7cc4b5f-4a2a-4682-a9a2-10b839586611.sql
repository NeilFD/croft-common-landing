-- Fix the log_audit_entry call in create_hold function to use correct parameter order
CREATE OR REPLACE FUNCTION public.create_hold(payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_event uuid := (payload->>'event_id')::uuid;
  v_space uuid := (payload->>'space_id')::uuid;
  v_title text := payload->>'title';
  v_status text := COALESCE(payload->>'status','hold_soft');
  v_start timestamptz := (payload->>'start_ts')::timestamptz;
  v_end   timestamptz := (payload->>'end_ts')::timestamptz;
  v_setup int := COALESCE((payload->>'setup_min')::int,0);
  v_teardown int := COALESCE((payload->>'teardown_min')::int,0);
  v_actor uuid := auth.uid();
  v_rank int;
BEGIN
  IF NOT (has_management_role(auth.uid(), 'admin'::management_role) OR has_management_role(auth.uid(), 'sales'::management_role)) THEN 
    RAISE EXCEPTION 'forbidden'; 
  END IF;
  
  IF v_event IS NULL OR v_space IS NULL OR v_title IS NULL OR v_start IS NULL OR v_end IS NULL THEN 
    RAISE EXCEPTION 'missing_required_fields'; 
  END IF;

  -- Priority check: block creating a lower/equal priority hold that conflicts with an existing higher/equal one
  WITH pr AS (SELECT rank FROM public.v_booking_priority WHERE status = v_status),
  conflicts AS (
    SELECT b.id, pb.rank as existing_rank, pr.rank as new_rank
    FROM public.bookings b
    JOIN public.v_booking_priority pb ON pb.status = b.status
    JOIN pr ON true
    WHERE b.space_id = v_space
      AND tstzrange(b.start_ts - (b.setup_min||' minutes')::interval,
                    b.end_ts   + (b.teardown_min||' minutes')::interval,'[)')
          && tstzrange(v_start - (v_setup||' minutes')::interval,
                       v_end   + (v_teardown||' minutes')::interval,'[)')
  )
  SELECT rank INTO v_rank FROM pr;

  IF EXISTS (SELECT 1 FROM conflicts WHERE existing_rank >= v_rank) THEN
    RAISE EXCEPTION 'conflict_with_higher_or_equal_priority';
  END IF;

  INSERT INTO public.bookings(id, event_id, space_id, title, start_ts, end_ts, setup_min, teardown_min, status, created_by)
  VALUES (v_id, v_event, v_space, v_title, v_start, v_end, v_setup, v_teardown, v_status, v_actor);

  -- Set event.primary_date if null
  UPDATE public.management_events e
     SET primary_date = COALESCE(e.primary_date, (v_start AT TIME ZONE 'UTC')::date)
   WHERE e.id = v_event;

  -- Log audit entry with correct parameter order: (entity_id, entity, action, actor_id, diff)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_audit_entry') THEN
    PERFORM public.log_audit_entry(v_id, 'bookings', 'insert', v_actor, payload);
  END IF;
  
  RETURN v_id;
END $$;