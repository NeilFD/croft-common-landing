
CREATE TABLE IF NOT EXISTS public.cb_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('general','rooms','dining','membership')),
  property TEXT CHECK (property IN ('town','country','either')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cb_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a CB enquiry" ON public.cb_enquiries;
CREATE POLICY "Anyone can submit a CB enquiry"
  ON public.cb_enquiries FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can read their own CB enquiry" ON public.cb_enquiries;
CREATE POLICY "Owners can read their own CB enquiry"
  ON public.cb_enquiries FOR SELECT
  USING (user_id IS NOT NULL AND auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cb_enquiries_created_at ON public.cb_enquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cb_enquiries_category ON public.cb_enquiries (category);
