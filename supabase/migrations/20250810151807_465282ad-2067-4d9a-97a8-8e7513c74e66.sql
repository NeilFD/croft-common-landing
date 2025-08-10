-- Add click tracking columns to notification_deliveries
ALTER TABLE public.notification_deliveries
  ADD COLUMN IF NOT EXISTS click_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS clicked_at timestamptz;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_click_token ON public.notification_deliveries(click_token);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_clicked ON public.notification_deliveries(notification_id, clicked_at);

-- Create push_optin_events table to track opt-in funnel
CREATE TABLE IF NOT EXISTS public.push_optin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NULL,
  subscription_id uuid NULL REFERENCES public.push_subscriptions(id) ON DELETE SET NULL,
  event text NOT NULL,
  platform text NULL,
  user_agent text NULL,
  endpoint text NULL,
  details jsonb NULL
);

-- Enable RLS and add SELECT policy for allowed-domain users
ALTER TABLE public.push_optin_events ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'push_optin_events' AND policyname = 'Allowed-domain users can view opt-in events'
  ) THEN
    CREATE POLICY "Allowed-domain users can view opt-in events"
    ON public.push_optin_events
    FOR SELECT
    USING (is_email_domain_allowed(get_user_email()));
  END IF;
END
$$;

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_push_optin_events_created_at ON public.push_optin_events(created_at);
CREATE INDEX IF NOT EXISTS idx_push_optin_events_event ON public.push_optin_events(event);