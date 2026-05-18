
-- Password metadata table
CREATE TABLE IF NOT EXISTS public.user_password_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  is_first_login BOOLEAN NOT NULL DEFAULT true,
  password_changed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_password_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage password metadata" ON public.user_password_metadata;
CREATE POLICY "Admins manage password metadata"
ON public.user_password_metadata
FOR ALL
USING (public.get_user_management_role(auth.uid()) = 'admin')
WITH CHECK (public.get_user_management_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users view own password metadata" ON public.user_password_metadata;
CREATE POLICY "Users view own password metadata"
ON public.user_password_metadata
FOR SELECT
USING (auth.uid() = user_id);

-- Deactivate management user
CREATE OR REPLACE FUNCTION public.deactivate_management_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_target_email text;
BEGIN
  v_caller_role := public.get_user_management_role(auth.uid());
  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can deactivate users';
  END IF;

  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot deactivate your own account';
  END IF;

  UPDATE public.management_profiles
    SET is_active = false
    WHERE user_id = p_user_id
    RETURNING email INTO v_target_email;

  DELETE FROM public.user_roles WHERE user_id = p_user_id;

  INSERT INTO public.management_user_audit (action, target_user_id, actor_id, details)
  VALUES ('user_deactivated', p_user_id, auth.uid(), jsonb_build_object('email', v_target_email));
END;
$$;

-- Force password change
CREATE OR REPLACE FUNCTION public.force_password_change(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
BEGIN
  v_caller_role := public.get_user_management_role(auth.uid());
  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only admins can force password changes';
  END IF;

  INSERT INTO public.user_password_metadata (user_id, must_change_password, is_first_login, created_by)
  VALUES (p_user_id, true, false, auth.uid())
  ON CONFLICT (user_id) DO UPDATE
    SET must_change_password = true,
        updated_at = now();

  INSERT INTO public.management_user_audit (action, target_user_id, actor_id, details)
  VALUES ('password_change_forced', p_user_id, auth.uid(), '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.deactivate_management_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_password_change(UUID) TO authenticated;
