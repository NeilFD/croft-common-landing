-- Update RLS policies for analytics tables to allow INSERT for all users
-- while keeping SELECT/UPDATE/DELETE admin-only

-- Drop existing restrictive policies and create new granular ones

-- USER_SESSIONS table
DROP POLICY IF EXISTS "Admin-only access to user sessions" ON public.user_sessions;

-- Admin-only policies for SELECT/UPDATE/DELETE
CREATE POLICY "Admin can view user sessions" ON public.user_sessions
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin can update user sessions" ON public.user_sessions
FOR UPDATE USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin can delete user sessions" ON public.user_sessions
FOR DELETE USING (is_email_domain_allowed(get_user_email()));

-- Allow all users to insert session data
CREATE POLICY "Anyone can insert user sessions" ON public.user_sessions
FOR INSERT WITH CHECK (true);

-- PAGE_VIEWS table
DROP POLICY IF EXISTS "Admin-only access to page views" ON public.page_views;

-- Admin-only policies for SELECT/UPDATE/DELETE
CREATE POLICY "Admin can view page views" ON public.page_views
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin can update page views" ON public.page_views
FOR UPDATE USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin can delete page views" ON public.page_views
FOR DELETE USING (is_email_domain_allowed(get_user_email()));

-- Allow all users to insert page view data
CREATE POLICY "Anyone can insert page views" ON public.page_views
FOR INSERT WITH CHECK (true);

-- USER_INTERACTIONS table
DROP POLICY IF EXISTS "Admin-only access to user interactions" ON public.user_interactions;

-- Admin-only policies for SELECT/UPDATE/DELETE
CREATE POLICY "Admin can view user interactions" ON public.user_interactions
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin can update user interactions" ON public.user_interactions
FOR UPDATE USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin can delete user interactions" ON public.user_interactions
FOR DELETE USING (is_email_domain_allowed(get_user_email()));

-- Allow all users to insert interaction data
CREATE POLICY "Anyone can insert user interactions" ON public.user_interactions
FOR INSERT WITH CHECK (true);

-- USER_JOURNEYS table
DROP POLICY IF EXISTS "Admin-only access to user journeys" ON public.user_journeys;

-- Admin-only policies for SELECT/UPDATE/DELETE
CREATE POLICY "Admin can view user journeys" ON public.user_journeys
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin can update user journeys" ON public.user_journeys
FOR UPDATE USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Admin can delete user journeys" ON public.user_journeys
FOR DELETE USING (is_email_domain_allowed(get_user_email()));

-- Allow all users to insert journey data
CREATE POLICY "Anyone can insert user journeys" ON public.user_journeys
FOR INSERT WITH CHECK (true);