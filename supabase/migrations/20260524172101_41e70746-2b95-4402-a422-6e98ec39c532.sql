
-- 1. Re-revoke column-level access to events.contact_email from anon/public
REVOKE SELECT (contact_email) ON public.events FROM anon;
REVOKE SELECT (contact_email) ON public.events FROM public;

-- 2. Tighten is_management_user to only recognised management roles
CREATE OR REPLACE FUNCTION public.is_management_user(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _uid
      AND role IN ('admin','sales','ops','finance','readonly')
  );
$$;

-- 3. Lock down realtime.messages (broadcast/presence). App uses postgres_changes
--    which is governed by table RLS, not these policies. Removing the open
--    "true" policies prevents any authenticated user from snooping or posting
--    to arbitrary broadcast/presence channels.
DROP POLICY IF EXISTS "authenticated can receive broadcasts" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated can send broadcasts" ON realtime.messages;

-- 4. Tighten notifications SELECT so broadcast rows can only be read when
--    they are not addressed to a specific user (i.e. truly broadcast).
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (is_broadcast = true AND user_id IS NULL)
);
