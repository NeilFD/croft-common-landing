-- Safely remove test cron jobs (will not error if they don't exist)
DO $$
BEGIN
  -- Try to remove the 6pm test job
  BEGIN
    PERFORM cron.unschedule('daily-lunch-schedule-6pm-test');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if job doesn't exist
  END;
  
  -- Try to remove any other potential test jobs
  BEGIN
    PERFORM cron.unschedule('daily-lunch-schedule-545pm-test');
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if job doesn't exist
  END;
END $$;

-- Create the proper production cron job for 11:00am GMT daily
SELECT cron.schedule(
  'daily-lunch-schedule-production',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xccidvoxhpgcnwinnyin.functions.supabase.co/functions/v1/send-daily-order-schedule',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
    body := '{"production": true}'::jsonb
  ) as request_id;
  $$
);