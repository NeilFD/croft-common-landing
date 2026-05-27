-- 1) Revoke contact_email column access from anonymous visitors on events
REVOKE SELECT (contact_email) ON public.events FROM anon;
REVOKE SELECT (contact_email) ON public.events FROM public;

-- 2) Explicit management-only SELECT policies for sensitive internal tables
--    (RLS is already enabled with no policies, so this just makes intent explicit
--     and unblocks admin UIs that read via the management role.)
DROP POLICY IF EXISTS "Management can read gold access codes" ON public.gold_access_codes;
CREATE POLICY "Management can read gold access codes"
  ON public.gold_access_codes
  FOR SELECT
  TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'ops'));

DROP POLICY IF EXISTS "Management can read secret words" ON public.secret_words;
CREATE POLICY "Management can read secret words"
  ON public.secret_words
  FOR SELECT
  TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'ops'));

DROP POLICY IF EXISTS "Users can read their own role" ON public.user_roles;
CREATE POLICY "Users can read their own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_management_role(auth.uid(), 'admin'));

-- 3) member_moments: enforce is_visible NOT NULL so the policy can't accidentally
--    treat a NULL row as visible.
UPDATE public.member_moments SET is_visible = true WHERE is_visible IS NULL;
ALTER TABLE public.member_moments ALTER COLUMN is_visible SET NOT NULL;
ALTER TABLE public.member_moments ALTER COLUMN is_visible SET DEFAULT true;