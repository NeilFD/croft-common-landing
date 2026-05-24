-- 1) Hide events.contact_email from unauthenticated visitors
REVOKE SELECT (contact_email) ON public.events FROM anon;

-- 2) Lock down marketing_settings to management users only
DROP POLICY IF EXISTS "Authenticated can read marketing settings" ON public.marketing_settings;
DROP POLICY IF EXISTS "Authenticated can insert marketing settings" ON public.marketing_settings;
DROP POLICY IF EXISTS "Authenticated can update marketing settings" ON public.marketing_settings;

CREATE POLICY "Management can read marketing settings"
  ON public.marketing_settings
  FOR SELECT
  TO authenticated
  USING (public.is_management_user(auth.uid()));

CREATE POLICY "Marketing editors can insert marketing settings"
  ON public.marketing_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_edit_marketing(auth.uid()));

CREATE POLICY "Marketing editors can update marketing settings"
  ON public.marketing_settings
  FOR UPDATE
  TO authenticated
  USING (public.can_edit_marketing(auth.uid()))
  WITH CHECK (public.can_edit_marketing(auth.uid()));

CREATE POLICY "Admins can delete marketing settings"
  ON public.marketing_settings
  FOR DELETE
  TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin'));