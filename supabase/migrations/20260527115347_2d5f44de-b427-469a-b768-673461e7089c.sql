
-- =========================================================
-- Karaoke booking engine — schema
-- =========================================================

-- Slots config
CREATE TABLE public.karaoke_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  label text,
  subtitle text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (day_of_week, start_time)
);
GRANT SELECT ON public.karaoke_slots TO anon, authenticated;
GRANT ALL ON public.karaoke_slots TO service_role;
ALTER TABLE public.karaoke_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active slots" ON public.karaoke_slots FOR SELECT USING (is_active = true);
CREATE POLICY "Management can manage slots" ON public.karaoke_slots FOR ALL TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'ops'))
  WITH CHECK (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'ops'));

-- F&B packages
CREATE TABLE public.karaoke_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('food','drink')),
  name text NOT NULL,
  description text,
  price_per_person_pennies integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.karaoke_packages TO anon, authenticated;
GRANT ALL ON public.karaoke_packages TO service_role;
ALTER TABLE public.karaoke_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packages" ON public.karaoke_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Management can manage packages" ON public.karaoke_packages FOR ALL TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'ops'))
  WITH CHECK (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'ops'));

-- Bookings
CREATE TABLE public.karaoke_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL,
  slot_start time NOT NULL,
  slot_end time NOT NULL,
  guest_first_name text NOT NULL,
  guest_last_name text,
  guest_email text NOT NULL,
  guest_phone text,
  party_size integer NOT NULL CHECK (party_size BETWEEN 2 AND 16),
  food_package_id uuid REFERENCES public.karaoke_packages(id) ON DELETE SET NULL,
  drink_package_id uuid REFERENCES public.karaoke_packages(id) ON DELETE SET NULL,
  notes text,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending_payment','confirmed','cancelled','cancelled_by_venue','no_show')),
  manage_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  deposit_status text NOT NULL DEFAULT 'dummy_paid' CHECK (deposit_status IN ('dummy_paid','paid','refunded','not_required','pending')),
  deposit_amount_pennies integer,
  cancelled_at timestamptz,
  cancelled_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX karaoke_bookings_one_per_slot
  ON public.karaoke_bookings (slot_date, slot_start)
  WHERE status IN ('pending_payment','confirmed');
CREATE INDEX karaoke_bookings_slot_date_idx ON public.karaoke_bookings (slot_date);
CREATE INDEX karaoke_bookings_email_idx ON public.karaoke_bookings (lower(guest_email));
GRANT SELECT, INSERT, UPDATE ON public.karaoke_bookings TO authenticated;
GRANT ALL ON public.karaoke_bookings TO service_role;
ALTER TABLE public.karaoke_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Management can view all bookings" ON public.karaoke_bookings FOR SELECT TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'sales') OR public.has_management_role(auth.uid(), 'ops'));
CREATE POLICY "Management can update bookings" ON public.karaoke_bookings FOR UPDATE TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'sales') OR public.has_management_role(auth.uid(), 'ops'));

-- Audit log
CREATE TABLE public.karaoke_booking_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.karaoke_bookings(id) ON DELETE CASCADE,
  action text NOT NULL,
  source text NOT NULL CHECK (source IN ('guest','management','system')),
  actor_id uuid,
  from_state jsonb,
  to_state jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX karaoke_booking_audit_booking_idx ON public.karaoke_booking_audit (booking_id, created_at DESC);
GRANT SELECT ON public.karaoke_booking_audit TO authenticated;
GRANT ALL ON public.karaoke_booking_audit TO service_role;
ALTER TABLE public.karaoke_booking_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Management can view audit log" ON public.karaoke_booking_audit FOR SELECT TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'sales') OR public.has_management_role(auth.uid(), 'ops'));

-- Settings (single-row config)
CREATE TABLE public.karaoke_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  venue_email text NOT NULL DEFAULT 'neil.fincham-dukes@crazybear.co.uk',
  cancellation_cutoff_hours integer NOT NULL DEFAULT 24,
  brief_minutes integer NOT NULL DEFAULT 15,
  turnover_minutes integer NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.karaoke_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
GRANT SELECT ON public.karaoke_settings TO authenticated;
GRANT ALL ON public.karaoke_settings TO service_role;
ALTER TABLE public.karaoke_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Management can view settings" ON public.karaoke_settings FOR SELECT TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'sales') OR public.has_management_role(auth.uid(), 'ops'));
CREATE POLICY "Admins can update settings" ON public.karaoke_settings FOR UPDATE TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_management_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER trg_karaoke_slots_updated BEFORE UPDATE ON public.karaoke_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_karaoke_packages_updated BEFORE UPDATE ON public.karaoke_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_karaoke_bookings_updated BEFORE UPDATE ON public.karaoke_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed slots: every day 12-2, 2-4, 4-6, 6-8
INSERT INTO public.karaoke_slots (day_of_week, start_time, end_time, label, subtitle, sort_order)
SELECT d, s.start_t, s.end_t, s.label, s.subtitle, s.sort
FROM generate_series(0,6) d,
     (VALUES
       ('12:00'::time, '14:00'::time, '12 – 2 pm', 'Lunch run', 1),
       ('14:00'::time, '16:00'::time, '2 – 4 pm',  'Matinee',   2),
       ('16:00'::time, '18:00'::time, '4 – 6 pm',  'Pre-dinner', 3),
       ('18:00'::time, '20:00'::time, '6 – 8 pm',  'Headliner', 4)
     ) AS s(start_t, end_t, label, subtitle, sort);

-- Seed F&B placeholders
INSERT INTO public.karaoke_packages (kind, name, description, sort_order) VALUES
  ('food','Snack run','Bar nibbles to soak up the sound. Pricing tbc.', 1),
  ('food','Pizza party','Stone-baked pizzas, dealt around the booth. Pricing tbc.', 2),
  ('food','Feast','Sharing boards and small plates. Pricing tbc.', 3),
  ('drink','House round','One cocktail or beer per person. Pricing tbc.', 1),
  ('drink','Fizz on arrival','A glass of fizz as you step in. Pricing tbc.', 2),
  ('drink','Bottomless soft','Unlimited soft drinks for the room. Pricing tbc.', 3);

-- =========================================================
-- RPCs
-- =========================================================

-- Availability: returns per-slot status for a date range (max 60 days)
CREATE OR REPLACE FUNCTION public.get_karaoke_availability(p_from date, p_to date)
RETURNS TABLE(slot_date date, day_of_week smallint, slot_start time, slot_end time, label text, subtitle text, status text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_to < p_from THEN RAISE EXCEPTION 'invalid date range'; END IF;
  IF (p_to - p_from) > 60 THEN RAISE EXCEPTION 'range too large'; END IF;

  RETURN QUERY
  WITH dates AS (
    SELECT d::date AS slot_date FROM generate_series(p_from, p_to, '1 day'::interval) d
  ),
  slots AS (
    SELECT d.slot_date, EXTRACT(DOW FROM d.slot_date)::smallint AS dow, s.start_time, s.end_time, s.label, s.subtitle
    FROM dates d
    JOIN public.karaoke_slots s ON s.day_of_week = EXTRACT(DOW FROM d.slot_date)::smallint AND s.is_active = true
  )
  SELECT
    sl.slot_date,
    sl.dow,
    sl.start_time,
    sl.end_time,
    sl.label,
    sl.subtitle,
    CASE
      WHEN sl.slot_date < CURRENT_DATE THEN 'gone'
      WHEN sl.slot_date = CURRENT_DATE AND sl.start_time <= CURRENT_TIME THEN 'gone'
      WHEN EXISTS (
        SELECT 1 FROM public.karaoke_bookings b
        WHERE b.slot_date = sl.slot_date
          AND b.slot_start = sl.start_time
          AND b.status IN ('pending_payment','confirmed')
      ) THEN 'gone'
      ELSE 'open'
    END AS status
  FROM slots sl
  ORDER BY sl.slot_date, sl.start_time;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_karaoke_availability(date, date) TO anon, authenticated;

-- Create booking (public)
CREATE OR REPLACE FUNCTION public.create_karaoke_booking(payload jsonb)
RETURNS TABLE(booking_id uuid, manage_token uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_date date := (payload->>'slot_date')::date;
  v_start time := (payload->>'slot_start')::time;
  v_end time;
  v_party int := (payload->>'party_size')::int;
  v_email text := lower(trim(payload->>'guest_email'));
  v_first text := trim(payload->>'guest_first_name');
  v_id uuid;
  v_token uuid;
BEGIN
  IF v_first IS NULL OR v_first = '' THEN RAISE EXCEPTION 'First name required'; END IF;
  IF v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN RAISE EXCEPTION 'Valid email required'; END IF;
  IF v_party < 2 OR v_party > 16 THEN RAISE EXCEPTION 'Party size must be 2–16'; END IF;
  IF v_date < CURRENT_DATE THEN RAISE EXCEPTION 'Cannot book in the past'; END IF;
  IF v_date = CURRENT_DATE AND v_start <= CURRENT_TIME THEN RAISE EXCEPTION 'Slot already started'; END IF;

  SELECT end_time INTO v_end FROM public.karaoke_slots
   WHERE day_of_week = EXTRACT(DOW FROM v_date)::smallint
     AND start_time = v_start AND is_active = true;
  IF v_end IS NULL THEN RAISE EXCEPTION 'Slot not available'; END IF;

  INSERT INTO public.karaoke_bookings (
    slot_date, slot_start, slot_end,
    guest_first_name, guest_last_name, guest_email, guest_phone,
    party_size, food_package_id, drink_package_id, notes,
    status, deposit_status
  ) VALUES (
    v_date, v_start, v_end,
    v_first, NULLIF(trim(payload->>'guest_last_name'),''), v_email, NULLIF(trim(payload->>'guest_phone'),''),
    v_party,
    NULLIF(payload->>'food_package_id','')::uuid,
    NULLIF(payload->>'drink_package_id','')::uuid,
    NULLIF(trim(payload->>'notes'),''),
    'confirmed', 'dummy_paid'
  )
  RETURNING id, karaoke_bookings.manage_token INTO v_id, v_token;

  INSERT INTO public.karaoke_booking_audit (booking_id, action, source, to_state, note)
  VALUES (v_id, 'created', 'guest', to_jsonb((SELECT b FROM public.karaoke_bookings b WHERE b.id = v_id)), 'Booking created via public site');

  RETURN QUERY SELECT v_id, v_token;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'That slot was just taken — please pick another.';
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_karaoke_booking(jsonb) TO anon, authenticated;

-- Get booking by manage token (public)
CREATE OR REPLACE FUNCTION public.get_karaoke_booking_by_token(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', b.id,
    'slot_date', b.slot_date,
    'slot_start', b.slot_start,
    'slot_end', b.slot_end,
    'guest_first_name', b.guest_first_name,
    'guest_last_name', b.guest_last_name,
    'guest_email', b.guest_email,
    'guest_phone', b.guest_phone,
    'party_size', b.party_size,
    'food_package_id', b.food_package_id,
    'drink_package_id', b.drink_package_id,
    'food_package', fp.name,
    'drink_package', dp.name,
    'notes', b.notes,
    'status', b.status,
    'deposit_status', b.deposit_status,
    'manage_token', b.manage_token,
    'cancelled_at', b.cancelled_at,
    'cancelled_reason', b.cancelled_reason,
    'created_at', b.created_at
  ) INTO v_result
  FROM public.karaoke_bookings b
  LEFT JOIN public.karaoke_packages fp ON fp.id = b.food_package_id
  LEFT JOIN public.karaoke_packages dp ON dp.id = b.drink_package_id
  WHERE b.manage_token = p_token;
  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_karaoke_booking_by_token(uuid) TO anon, authenticated;

-- Update by token (guest self-serve)
CREATE OR REPLACE FUNCTION public.update_karaoke_booking_by_token(p_token uuid, patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_booking public.karaoke_bookings%ROWTYPE;
  v_cutoff_hours int;
  v_new_date date;
  v_new_start time;
  v_new_end time;
  v_new_party int;
BEGIN
  SELECT * INTO v_booking FROM public.karaoke_bookings WHERE manage_token = p_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF v_booking.status NOT IN ('confirmed','pending_payment') THEN RAISE EXCEPTION 'Booking cannot be changed'; END IF;

  SELECT cancellation_cutoff_hours INTO v_cutoff_hours FROM public.karaoke_settings WHERE id = 1;
  IF (v_booking.slot_date + v_booking.slot_start) - now() < (v_cutoff_hours || ' hours')::interval THEN
    RAISE EXCEPTION 'Too close to slot — call the venue to change.';
  END IF;

  v_new_date := COALESCE((patch->>'slot_date')::date, v_booking.slot_date);
  v_new_start := COALESCE((patch->>'slot_start')::time, v_booking.slot_start);
  v_new_party := COALESCE((patch->>'party_size')::int, v_booking.party_size);

  IF v_new_party < 2 OR v_new_party > 16 THEN RAISE EXCEPTION 'Party size must be 2–16'; END IF;

  IF v_new_date <> v_booking.slot_date OR v_new_start <> v_booking.slot_start THEN
    SELECT end_time INTO v_new_end FROM public.karaoke_slots
      WHERE day_of_week = EXTRACT(DOW FROM v_new_date)::smallint
        AND start_time = v_new_start AND is_active = true;
    IF v_new_end IS NULL THEN RAISE EXCEPTION 'Selected slot not available'; END IF;
    IF EXISTS (
      SELECT 1 FROM public.karaoke_bookings b
      WHERE b.slot_date = v_new_date AND b.slot_start = v_new_start
        AND b.status IN ('pending_payment','confirmed')
        AND b.id <> v_booking.id
    ) THEN
      RAISE EXCEPTION 'Slot already taken';
    END IF;
  ELSE
    v_new_end := v_booking.slot_end;
  END IF;

  UPDATE public.karaoke_bookings SET
    slot_date = v_new_date,
    slot_start = v_new_start,
    slot_end = v_new_end,
    party_size = v_new_party,
    food_package_id = CASE WHEN patch ? 'food_package_id' THEN NULLIF(patch->>'food_package_id','')::uuid ELSE food_package_id END,
    drink_package_id = CASE WHEN patch ? 'drink_package_id' THEN NULLIF(patch->>'drink_package_id','')::uuid ELSE drink_package_id END,
    notes = CASE WHEN patch ? 'notes' THEN NULLIF(trim(patch->>'notes'),'') ELSE notes END
  WHERE id = v_booking.id;

  INSERT INTO public.karaoke_booking_audit (booking_id, action, source, from_state, to_state)
  VALUES (v_booking.id, 'updated', 'guest', to_jsonb(v_booking),
          to_jsonb((SELECT b FROM public.karaoke_bookings b WHERE b.id = v_booking.id)));

  RETURN public.get_karaoke_booking_by_token(p_token);
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_karaoke_booking_by_token(uuid, jsonb) TO anon, authenticated;

-- Cancel by token
CREATE OR REPLACE FUNCTION public.cancel_karaoke_booking_by_token(p_token uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_booking public.karaoke_bookings%ROWTYPE;
  v_cutoff_hours int;
BEGIN
  SELECT * INTO v_booking FROM public.karaoke_bookings WHERE manage_token = p_token;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF v_booking.status IN ('cancelled','cancelled_by_venue') THEN
    RETURN public.get_karaoke_booking_by_token(p_token);
  END IF;

  SELECT cancellation_cutoff_hours INTO v_cutoff_hours FROM public.karaoke_settings WHERE id = 1;
  IF (v_booking.slot_date + v_booking.slot_start) - now() < (v_cutoff_hours || ' hours')::interval THEN
    RAISE EXCEPTION 'Too close to slot — call the venue to cancel.';
  END IF;

  UPDATE public.karaoke_bookings SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_reason = COALESCE(p_reason, 'Cancelled by guest')
  WHERE id = v_booking.id;

  INSERT INTO public.karaoke_booking_audit (booking_id, action, source, from_state, to_state, note)
  VALUES (v_booking.id, 'cancelled', 'guest', to_jsonb(v_booking),
          to_jsonb((SELECT b FROM public.karaoke_bookings b WHERE b.id = v_booking.id)),
          p_reason);

  RETURN public.get_karaoke_booking_by_token(p_token);
END;
$$;
GRANT EXECUTE ON FUNCTION public.cancel_karaoke_booking_by_token(uuid, text) TO anon, authenticated;

-- Management: update booking
CREATE OR REPLACE FUNCTION public.management_update_karaoke_booking(p_id uuid, patch jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_booking public.karaoke_bookings%ROWTYPE;
BEGIN
  IF NOT (public.has_management_role(auth.uid(),'admin') OR public.has_management_role(auth.uid(),'sales') OR public.has_management_role(auth.uid(),'ops')) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  SELECT * INTO v_booking FROM public.karaoke_bookings WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  UPDATE public.karaoke_bookings SET
    slot_date = COALESCE((patch->>'slot_date')::date, slot_date),
    slot_start = COALESCE((patch->>'slot_start')::time, slot_start),
    slot_end = COALESCE((patch->>'slot_end')::time, slot_end),
    party_size = COALESCE((patch->>'party_size')::int, party_size),
    guest_first_name = COALESCE(NULLIF(trim(patch->>'guest_first_name'),''), guest_first_name),
    guest_last_name = CASE WHEN patch ? 'guest_last_name' THEN NULLIF(trim(patch->>'guest_last_name'),'') ELSE guest_last_name END,
    guest_email = COALESCE(NULLIF(lower(trim(patch->>'guest_email')),''), guest_email),
    guest_phone = CASE WHEN patch ? 'guest_phone' THEN NULLIF(trim(patch->>'guest_phone'),'') ELSE guest_phone END,
    food_package_id = CASE WHEN patch ? 'food_package_id' THEN NULLIF(patch->>'food_package_id','')::uuid ELSE food_package_id END,
    drink_package_id = CASE WHEN patch ? 'drink_package_id' THEN NULLIF(patch->>'drink_package_id','')::uuid ELSE drink_package_id END,
    notes = CASE WHEN patch ? 'notes' THEN NULLIF(trim(patch->>'notes'),'') ELSE notes END,
    status = COALESCE(NULLIF(patch->>'status',''), status)
  WHERE id = p_id;

  INSERT INTO public.karaoke_booking_audit (booking_id, action, source, actor_id, from_state, to_state)
  VALUES (p_id, 'updated', 'management', auth.uid(), to_jsonb(v_booking),
          to_jsonb((SELECT b FROM public.karaoke_bookings b WHERE b.id = p_id)));

  RETURN to_jsonb((SELECT b FROM public.karaoke_bookings b WHERE b.id = p_id));
END;
$$;
GRANT EXECUTE ON FUNCTION public.management_update_karaoke_booking(uuid, jsonb) TO authenticated;

-- Management: cancel booking
CREATE OR REPLACE FUNCTION public.management_cancel_karaoke_booking(p_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_booking public.karaoke_bookings%ROWTYPE;
BEGIN
  IF NOT (public.has_management_role(auth.uid(),'admin') OR public.has_management_role(auth.uid(),'sales') OR public.has_management_role(auth.uid(),'ops')) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  SELECT * INTO v_booking FROM public.karaoke_bookings WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found'; END IF;

  UPDATE public.karaoke_bookings SET
    status = 'cancelled_by_venue',
    cancelled_at = now(),
    cancelled_reason = COALESCE(p_reason,'Cancelled by venue')
  WHERE id = p_id;

  INSERT INTO public.karaoke_booking_audit (booking_id, action, source, actor_id, from_state, to_state, note)
  VALUES (p_id, 'cancelled_by_venue', 'management', auth.uid(), to_jsonb(v_booking),
          to_jsonb((SELECT b FROM public.karaoke_bookings b WHERE b.id = p_id)), p_reason);

  RETURN to_jsonb((SELECT b FROM public.karaoke_bookings b WHERE b.id = p_id));
END;
$$;
GRANT EXECUTE ON FUNCTION public.management_cancel_karaoke_booking(uuid, text) TO authenticated;
