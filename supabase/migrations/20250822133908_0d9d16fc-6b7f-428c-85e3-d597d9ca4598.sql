-- Add sync tracking to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN last_mailchimp_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN mailchimp_sync_status TEXT DEFAULT 'pending',
ADD COLUMN mailchimp_member_id TEXT,
ADD COLUMN sync_error TEXT;

-- Create index for sync queries
CREATE INDEX idx_subscribers_sync_status ON public.subscribers(mailchimp_sync_status);
CREATE INDEX idx_subscribers_last_sync ON public.subscribers(last_mailchimp_sync_at);

-- Create sync jobs table for tracking scheduled syncs
CREATE TABLE public.mailchimp_sync_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL, -- 'daily', 'weekly', 'manual'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  processed_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on sync jobs table
ALTER TABLE public.mailchimp_sync_jobs ENABLE ROW LEVEL SECURITY;

-- Allow system and admin access to sync jobs
CREATE POLICY "System can manage sync jobs" ON public.mailchimp_sync_jobs
FOR ALL USING (true);

CREATE POLICY "Admins can view sync jobs" ON public.mailchimp_sync_jobs
FOR SELECT USING (is_email_domain_allowed(get_user_email()));

-- Create cron jobs for automated syncing
-- Daily reconciliation sync at 2 AM UTC
SELECT cron.schedule(
  'mailchimp-daily-reconciliation',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/mailchimp-reconciliation-sync',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
    body := '{"jobType": "daily"}'::jsonb
  );
  $$
);

-- Weekly full sync on Sundays at 1 AM UTC
SELECT cron.schedule(
  'mailchimp-weekly-full-sync',
  '0 1 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/mailchimp-full-sync',  
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
    body := '{"jobType": "weekly"}'::jsonb
  );
  $$
);