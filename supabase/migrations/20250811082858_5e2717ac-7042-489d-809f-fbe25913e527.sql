-- Ensure required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Unschedule existing job (if any)
select cron.unschedule('process-scheduled-notifications-every-minute');

-- Schedule the processor to run every minute (UTC) with the correct v1 path
select
  cron.schedule(
    'process-scheduled-notifications-every-minute',
    '* * * * *',
    $$
    select
      net.http_post(
        url    := 'https://xccidvoxhpgcnwinnyin.functions.supabase.co/functions/v1/process-scheduled-notifications',
        headers:= '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
        body   := jsonb_build_object('source','pg_cron','invoked_at', now()::text)
      );
    $$
  );

-- Immediate run so due notifications go now
select
  net.http_post(
    url    := 'https://xccidvoxhpgcnwinnyin.functions.supabase.co/functions/v1/process-scheduled-notifications',
    headers:= '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
    body   := jsonb_build_object('source','manual','invoked_at', now()::text)
  );