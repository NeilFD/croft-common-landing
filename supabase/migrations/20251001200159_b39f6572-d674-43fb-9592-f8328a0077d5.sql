-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Schedule daily feedback report generation at 03:00
SELECT cron.schedule(
  'generate-daily-feedback-report',
  '0 3 * * *', -- At 03:00 every day
  $$
  SELECT
    net.http_post(
      url := 'https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/generate-daily-feedback-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU'
      ),
      body := jsonb_build_object(
        'scheduled', true,
        'timestamp', now()
      )
    ) as request_id;
  $$
);