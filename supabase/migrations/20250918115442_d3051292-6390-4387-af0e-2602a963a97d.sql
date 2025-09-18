-- Enable admin INSERT/UPDATE on cinema_releases via RLS policies
-- Keep existing public SELECT

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.cinema_releases ENABLE ROW LEVEL SECURITY;

-- Policy: Allowed domain users (admins) can insert cinema releases
CREATE POLICY "Admins can insert cinema releases"
ON public.cinema_releases
FOR INSERT
TO public
WITH CHECK (is_email_domain_allowed(get_user_email()));

-- Policy: Allowed domain users (admins) can update cinema releases
CREATE POLICY "Admins can update cinema releases"
ON public.cinema_releases
FOR UPDATE
TO public
USING (is_email_domain_allowed(get_user_email()))
WITH CHECK (is_email_domain_allowed(get_user_email()));

-- Optional but safe: allow admins to delete releases if needed later
-- (commented out – uncomment if required)
-- CREATE POLICY "Admins can delete cinema releases"
-- ON public.cinema_releases
-- FOR DELETE
-- TO public
-- USING (is_email_domain_allowed(get_user_email()));