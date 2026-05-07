-- No-arg get_cinema_status returning current month's active release plus ticket counts
CREATE OR REPLACE FUNCTION public.get_cinema_status()
RETURNS TABLE (
  release_id uuid,
  month_key text,
  screening_date date,
  doors_time time,
  screening_time time,
  capacity integer,
  tickets_sold bigint,
  tickets_left integer,
  is_sold_out boolean,
  title text,
  description text,
  poster_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_key text;
BEGIN
  v_month_key := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  RETURN QUERY
  SELECT
    r.id AS release_id,
    r.month_key,
    r.screening_date,
    r.doors_time,
    r.screening_time,
    r.capacity,
    COALESCE(SUM(b.quantity), 0)::bigint AS tickets_sold,
    GREATEST(0, r.capacity - COALESCE(SUM(b.quantity), 0))::integer AS tickets_left,
    (COALESCE(SUM(b.quantity), 0) >= r.capacity) AS is_sold_out,
    r.title,
    r.description,
    r.poster_url
  FROM public.cinema_releases r
  LEFT JOIN public.cinema_bookings b ON b.release_id = r.id
  WHERE r.is_active = true
    AND r.month_key = v_month_key
  GROUP BY r.id
  ORDER BY r.screening_date DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_cinema_status() TO anon, authenticated;

-- Seed a release for the current month if none exists (last Thursday of the month)
DO $$
DECLARE
  v_month_key text := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  v_first date := DATE_TRUNC('month', CURRENT_DATE)::date;
  v_last date := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date;
  v_screening date;
BEGIN
  -- Find last Thursday of the month
  v_screening := v_last;
  WHILE EXTRACT(DOW FROM v_screening) <> 4 LOOP
    v_screening := v_screening - 1;
  END LOOP;

  IF NOT EXISTS (SELECT 1 FROM public.cinema_releases WHERE month_key = v_month_key) THEN
    INSERT INTO public.cinema_releases (
      month_key, screening_date, doors_time, screening_time,
      capacity, is_active, title, description
    ) VALUES (
      v_month_key, v_screening, '19:00', '19:30',
      50, true, 'Secret Cinema Club',
      'One night. One screen. Fifty tickets. Always uncommonly good.'
    );
  END IF;
END $$;