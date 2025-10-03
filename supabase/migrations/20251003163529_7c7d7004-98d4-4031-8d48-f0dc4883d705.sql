-- Fix overly permissive RLS policy on user_password_metadata
-- Only RPC functions should modify this table

DROP POLICY IF EXISTS "System can manage password metadata" ON public.user_password_metadata;

-- Users can only update their own password metadata via RPC functions
-- No direct INSERT/UPDATE/DELETE allowed
CREATE POLICY "Users cannot directly modify password metadata"
  ON public.user_password_metadata
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Migrate existing user roles to new structure
-- Map sales, ops, finance, readonly -> manager
DO $$
BEGIN
  UPDATE public.user_roles 
  SET role = 'manager'::management_role 
  WHERE role::text IN ('sales', 'ops', 'finance', 'readonly');
END $$;

-- Backfill password metadata for existing users
INSERT INTO public.user_password_metadata (user_id, must_change_password, is_first_login, password_changed_at, created_by)
SELECT 
  ur.user_id,
  false,
  false,
  now(),
  NULL
FROM public.user_roles ur
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_password_metadata upm WHERE upm.user_id = ur.user_id
);