-- Extend public.bookings to support space-based provisional holds shown on the calendar
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES public.spaces(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS start_ts timestamptz,
  ADD COLUMN IF NOT EXISTS end_ts timestamptz,
  ADD COLUMN IF NOT EXISTS setup_min integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS teardown_min integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Legacy NOT NULL constraints would block new-style provisional rows, drop them
ALTER TABLE public.bookings ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN date DROP NOT NULL;

CREATE INDEX IF NOT EXISTS bookings_space_start_idx
  ON public.bookings (space_id, start_ts);
CREATE INDEX IF NOT EXISTS bookings_lead_idx
  ON public.bookings (lead_id);

-- Keep updated_at fresh
DROP TRIGGER IF EXISTS bookings_set_updated_at ON public.bookings;
CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: bookings table currently has RLS enabled but no policies (so no one can read/write).
-- Admins manage everything; no public access.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view bookings" ON public.bookings;
CREATE POLICY "Admins can view bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert bookings" ON public.bookings;
CREATE POLICY "Admins can insert bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));