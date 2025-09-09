-- Delete the problematic cron jobs that are causing email spam
-- Job 10: Every minute job (causing spam)
-- Job 13: Test job at 5:15 PM (no longer needed)

SELECT cron.unschedule(10);
SELECT cron.unschedule(13);