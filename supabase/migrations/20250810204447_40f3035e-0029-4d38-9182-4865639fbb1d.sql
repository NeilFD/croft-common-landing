
-- Extend notifications for scheduling and recurring sends
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz NULL,
  ADD COLUMN IF NOT EXISTS schedule_timezone text NULL,
  -- repeat_rule JSON structure example:
  -- { "type": "daily" | "weekly" | "monthly",
  --   "every": 1,
  --   "weekdays": [1,3,5],   -- for weekly (1=Mon ... 7=Sun)
  --   "dayOfMonth": 15,      -- for monthly
  --   "end": { "type": "onDate" | "after", "date": "2025-12-31T23:59:00Z", "occurrences": 10 }
  -- }
  ADD COLUMN IF NOT EXISTS repeat_rule jsonb NULL,
  ADD COLUMN IF NOT EXISTS repeat_until timestamptz NULL,
  ADD COLUMN IF NOT EXISTS occurrences_limit integer NULL,
  ADD COLUMN IF NOT EXISTS times_sent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_id uuid NULL REFERENCES public.notifications(id) ON DELETE SET NULL;

-- Helpful indexes for picking up due jobs and reporting
CREATE INDEX IF NOT EXISTS idx_notifications_status_scheduled_for
  ON public.notifications (status, scheduled_for);

CREATE INDEX IF NOT EXISTS idx_notifications_parent_id
  ON public.notifications (parent_id);

-- Keep updated_at fresh when editing notifications (draft edits, scheduling changes, etc.)
DROP TRIGGER IF EXISTS trg_notifications_set_updated_at ON public.notifications;

CREATE TRIGGER trg_notifications_set_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
