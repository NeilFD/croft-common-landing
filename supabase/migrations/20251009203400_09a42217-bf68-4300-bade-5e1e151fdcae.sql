-- Create mobile_debug_logs table for automated client-side logging
CREATE TABLE IF NOT EXISTS public.mobile_debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  step TEXT NOT NULL,
  data JSONB,
  error_message TEXT,
  user_agent TEXT,
  platform TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_mobile_debug_logs_session_id ON public.mobile_debug_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_mobile_debug_logs_created_at ON public.mobile_debug_logs(created_at DESC);

-- RLS: System can insert, admins can read
ALTER TABLE public.mobile_debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert debug logs"
  ON public.mobile_debug_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view debug logs"
  ON public.mobile_debug_logs
  FOR SELECT
  USING (is_email_domain_allowed(get_user_email()));