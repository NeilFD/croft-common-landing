-- Remove the duplicate 4 PM cron job we just created
SELECT cron.unschedule('send-daily-lunch-order-summary');

-- Update the existing weekday cron job to run at 4:30 PM UK time (15:30 UTC for BST)
SELECT cron.unschedule('send-daily-order-schedule-weekdays');

-- Create the updated cron job for 4:30 PM UK time testing
SELECT cron.schedule(
  'send-daily-order-schedule-test',
  '30 15 * * *', -- Every day at 3:30 PM UTC (4:30 PM BST)
  $$
  SELECT
    net.http_post(
        url:='https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/send-daily-order-schedule',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);