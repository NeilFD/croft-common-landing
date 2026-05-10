
-- 1) Tighten events: keep public read access for the calendar/SEO but stop exposing organiser email to anonymous visitors
REVOKE SELECT (contact_email) ON public.events FROM anon;

-- 2) Restrict member_profiles_extended SELECT to the owner only
DROP POLICY IF EXISTS "Authenticated can view extended profiles" ON public.member_profiles_extended;
CREATE POLICY "Members can view their own extended profile"
ON public.member_profiles_extended
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Restrict member_moments SELECT: own moments, or approved+visible, or admins
DROP POLICY IF EXISTS "Member moments are viewable by authenticated users" ON public.member_moments;
CREATE POLICY "Members can view their own or approved moments"
ON public.member_moments
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR (is_approved = true AND COALESCE(is_visible, true) = true)
  OR public.is_admin(auth.uid())
);

-- 4) Convert profiles_public view to security_invoker so RLS of the caller is enforced
ALTER VIEW public.profiles_public SET (security_invoker = on);

-- 5) Drop the now-unused allowed_domains table (admin access is enforced via admin_allowlist)
DROP FUNCTION IF EXISTS public.is_email_domain_allowed(text);
DROP TABLE IF EXISTS public.allowed_domains;

-- 6) Add SET search_path = public to the SECURITY DEFINER helper functions that were missing it
ALTER FUNCTION public.get_cinema_status(uuid) SET search_path = public;
ALTER FUNCTION public.check_secret_kitchen_access_status(text) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

-- 7) Lock down the email queue helper RPCs - only the service role should drive the queue
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated;
