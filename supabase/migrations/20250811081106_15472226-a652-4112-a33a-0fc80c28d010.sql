
-- 1) Enable required extensions (safe if already enabled)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- 2) Remove any job with the same name (no-op if it doesn't exist)
select cron.unschedule('process-scheduled-notifications-every-minute');

-- 3) Schedule the processor to run every minute
select
  cron.schedule(
    'process-scheduled-notifications-every-minute',
    '* * * * *', -- every minute
    $$
    select
      net.http_post(
        url    := 'https://xccidvoxhpgcnwinnyin.functions.supabase.co/process-scheduled-notifications',
        headers:= '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
        body   := jsonb_build_object('source','pg_cron','invoked_at', now()::text)
      );
    $$
  );

-- 4) Kick off one immediate run so already-due notifications go now
select
  net.http_post(
    url    := 'https://xccidvoxhpgcnwinnyin.functions.supabase.co/process-scheduled-notifications',
    headers:= '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
    body   := jsonb_build_object('source','manual','invoked_at', now()::text)
  );
