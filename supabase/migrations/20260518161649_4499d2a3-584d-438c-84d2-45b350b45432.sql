
CREATE TABLE IF NOT EXISTS public.management_user_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  target_user_id UUID,
  actor_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.management_user_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit" ON public.management_user_audit;
CREATE POLICY "Admins read audit"
ON public.management_user_audit
FOR SELECT
USING (public.get_user_management_role(auth.uid()) = 'admin');
