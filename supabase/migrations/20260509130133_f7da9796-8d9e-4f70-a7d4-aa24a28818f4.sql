
ALTER TABLE public.cinema_bookings
  ADD COLUMN IF NOT EXISTS wallet_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_cinema_bookings_wallet_token ON public.cinema_bookings(wallet_token);

DROP FUNCTION IF EXISTS public.create_cinema_booking(uuid, text, text, text, integer);

CREATE FUNCTION public.create_cinema_booking(_user_id uuid, _email text, _primary_name text, _guest_name text, _quantity integer)
 RETURNS TABLE(ticket_numbers integer[], release_id uuid, wallet_token uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_release_id UUID;
  v_capacity INTEGER;
  v_booked INTEGER;
  v_month_key TEXT;
  v_tickets INTEGER[];
  v_token UUID;
BEGIN
  v_month_key := TO_CHAR(CURRENT_DATE, 'YYYY-MM');

  SELECT r.id, r.capacity INTO v_release_id, v_capacity
  FROM public.cinema_releases r
  WHERE r.month_key = v_month_key AND r.is_active = true
  ORDER BY r.screening_date DESC
  LIMIT 1;

  IF v_release_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(b.quantity), 0) INTO v_booked
  FROM public.cinema_bookings b
  WHERE b.release_id = v_release_id;

  IF (v_capacity - v_booked) < _quantity THEN
    RETURN;
  END IF;

  FOR i IN 1.._quantity LOOP
    v_tickets := array_append(v_tickets, v_booked + i);
  END LOOP;

  INSERT INTO public.cinema_bookings (release_id, user_id, quantity, guest_name, guest_email)
  VALUES (v_release_id, _user_id, _quantity, _primary_name || COALESCE(' + ' || _guest_name, ''), _email)
  RETURNING cinema_bookings.wallet_token INTO v_token;

  RETURN QUERY SELECT v_tickets, v_release_id, v_token;
END;
$function$;
