-- Create a cron job to process access reminders every 15 minutes
-- First, ensure the cron extension is enabled (it should already be)
-- This will check for users who need reminder emails sent

SELECT cron.schedule(
  'process-secret-kitchen-access-reminders',
  '*/15 * * * *', -- every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/process-access-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
        body:=concat('{"timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);