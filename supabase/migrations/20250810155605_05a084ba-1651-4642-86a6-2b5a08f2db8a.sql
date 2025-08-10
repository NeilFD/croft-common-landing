-- Add archived flag to notifications for admin archiving
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Helpful index for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_archived_created_at
  ON public.notifications (archived, created_at DESC);
