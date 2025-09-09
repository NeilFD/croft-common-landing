-- Remove the existing 5:30 PM test job if it exists
SELECT cron.unschedule('daily-lunch-schedule-530pm-test');

-- Create a new test cron job for 5:45 PM GMT
SELECT cron.schedule(
  'daily-lunch-schedule-545pm-test',
  '45 17 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/send-daily-order-schedule',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
    body := '{"test": true, "scheduled_time": "17:45 GMT"}'::jsonb
  ) as request_id;
  $$
);