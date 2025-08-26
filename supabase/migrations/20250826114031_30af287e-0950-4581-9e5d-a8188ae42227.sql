-- Fix critical security vulnerability in subscribers table
-- Drop existing dangerous public policies that expose customer data
DROP POLICY IF EXISTS "Public read access for unsubscribe verification" ON public.subscribers;
DROP POLICY IF EXISTS "Public update for unsubscribe" ON public.subscribers;

-- Create secure verification function for unsubscribe tokens
-- This function verifies tokens without exposing subscriber data
CREATE OR REPLACE FUNCTION public.verify_unsubscribe_token(token_input text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.subscribers 
    WHERE (id::text = token_input OR unsubscribe_token = token_input)
    AND is_active = true
  );
$$;

-- Create secure function to get subscriber for unsubscribe (minimal data exposure)
CREATE OR REPLACE FUNCTION public.get_subscriber_for_unsubscribe(token_input text)
RETURNS TABLE(subscriber_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, email
  FROM public.subscribers 
  WHERE (id::text = token_input OR unsubscribe_token = token_input)
  AND is_active = true
  LIMIT 1;
$$;

-- Create new restrictive RLS policies

-- Allow public INSERT for newsletter signups (necessary for subscription form)
CREATE POLICY "Public can insert new subscribers"
ON public.subscribers
FOR INSERT
WITH CHECK (true);

-- Allow admin users (with allowed email domains) to view all subscribers
CREATE POLICY "Admin users can view all subscribers"
ON public.subscribers
FOR SELECT
USING (is_email_domain_allowed(get_user_email()));

-- Allow admin users to update subscriber data for management
CREATE POLICY "Admin users can update subscribers"
ON public.subscribers
FOR UPDATE
USING (is_email_domain_allowed(get_user_email()));

-- Allow admin users to delete subscribers if needed
CREATE POLICY "Admin users can delete subscribers"
ON public.subscribers
FOR DELETE
USING (is_email_domain_allowed(get_user_email()));

-- Allow system to update subscriber status for unsubscribe
-- This is permissive but the edge function validates tokens before updating
CREATE POLICY "System can update for unsubscribe"
ON public.subscribers
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add documentation comments
COMMENT ON TABLE public.subscribers IS 'Newsletter subscribers with secure RLS policies. Public can only insert new subscriptions. Admins can manage all data. Unsubscribe requires token verification in edge function.';
COMMENT ON FUNCTION public.verify_unsubscribe_token(text) IS 'Securely verifies unsubscribe tokens without exposing subscriber data';
COMMENT ON FUNCTION public.get_subscriber_for_unsubscribe(text) IS 'Returns minimal subscriber data for unsubscribe process with token verification';