-- Create new cron job for daily lunch schedule at 11 AM
SELECT cron.schedule(
  'send-daily-lunch-schedule',
  '0 11 * * 1-5', -- 11:00 AM Monday to Friday (production time)
  $$
  SELECT
    net.http_post(
        url:='https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/send-daily-order-schedule',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);