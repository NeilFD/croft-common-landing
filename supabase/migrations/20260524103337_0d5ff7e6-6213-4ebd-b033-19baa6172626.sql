DROP POLICY IF EXISTS "Anyone can submit a CB enquiry" ON public.cb_enquiries;

CREATE POLICY "Anyone can submit a CB enquiry"
ON public.cb_enquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);