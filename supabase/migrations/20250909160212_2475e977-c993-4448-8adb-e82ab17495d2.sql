-- Update the 5 PM test job to 5:15 PM GMT
SELECT cron.unschedule('daily-lunch-schedule-5pm-test');

-- Create new 5:15 PM GMT test job (17:15 UTC)
SELECT cron.schedule(
  'daily-lunch-schedule-515pm-test',
  '15 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/send-daily-order-schedule',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
    body := '{"test": true, "scheduled_time": "17:15 UTC"}'::jsonb
  ) as request_id;
  $$
);