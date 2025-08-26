-- Fix critical security vulnerability in mailchimp_sync_jobs table
-- The table currently has an overly permissive policy allowing public access

-- Drop the dangerous policy that allows anyone to do everything
DROP POLICY IF EXISTS "System can manage sync jobs" ON public.mailchimp_sync_jobs;

-- Keep the admin-only SELECT policy (this one is correct)
-- Policy "Admins can view sync jobs" already exists and is secure

-- Create secure policies for system operations
-- Allow service role to insert new sync jobs
CREATE POLICY "Service role can insert sync jobs"
ON public.mailchimp_sync_jobs
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Allow service role to update sync jobs (for status updates, etc.)
CREATE POLICY "Service role can update sync jobs"
ON public.mailchimp_sync_jobs
FOR UPDATE
USING (auth.role() = 'service_role');

-- Allow service role to delete old sync jobs if needed
CREATE POLICY "Service role can delete sync jobs"
ON public.mailchimp_sync_jobs
FOR DELETE
USING (auth.role() = 'service_role');

-- Add documentation
COMMENT ON TABLE public.mailchimp_sync_jobs IS 'Mailchimp sync job tracking with secure RLS policies. Admins can view all jobs. Only service role can manage jobs. Public access blocked to protect customer data.';

-- Additional security: Add a constraint to prevent storing too much sensitive data
-- This helps limit the exposure in case of future vulnerabilities
ALTER TABLE public.mailchimp_sync_jobs 
ADD CONSTRAINT check_error_details_size 
CHECK (pg_column_size(error_details) <= 65536); -- 64KB limit