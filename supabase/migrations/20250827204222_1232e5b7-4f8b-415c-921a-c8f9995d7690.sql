-- Schedule the calculate-weekly-streaks function to run every Sunday at 23:59 GMT
-- This will finalize weeks, calculate completed sets, award rewards, and manage grace periods

SELECT cron.schedule(
  'calculate-weekly-streaks',
  '59 23 * * 0', -- Sunday at 23:59 GMT (0 = Sunday in cron)
  $$
  SELECT
    net.http_post(
        url:='https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/calculate-weekly-streaks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
        body:='{"triggered_by": "cron", "time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);