-- Remove the broken 17:45 GMT test job
SELECT cron.unschedule('daily-lunch-schedule-545pm-test');

-- Create a new test cron job for 18:00 GMT with CORRECT URL format
SELECT cron.schedule(
  'daily-lunch-schedule-6pm-test',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xccidvoxhpgcnwinnyin.functions.supabase.co/functions/v1/send-daily-order-schedule',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
    body := '{"test": true, "scheduled_time": "18:00 GMT"}'::jsonb
  ) as request_id;
  $$
);