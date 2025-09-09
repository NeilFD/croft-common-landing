-- Create daily cron job to send lunch order summary email at 4 PM
SELECT cron.schedule(
  'send-daily-lunch-order-summary',
  '0 16 * * *', -- Every day at 4 PM (16:00)
  $$
  SELECT
    net.http_post(
        url:='https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/send-daily-order-schedule',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);