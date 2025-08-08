-- Create table for Common Good messages
CREATE TABLE IF NOT EXISTS public.common_good_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'gbp',
  message TEXT NOT NULL CHECK (char_length(message) <= 250),
  posted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.common_good_messages ENABLE ROW LEVEL SECURITY;

-- Public can read all messages (feed is public)
CREATE POLICY IF NOT EXISTS "Public can read common good messages"
ON public.common_good_messages
FOR SELECT
USING (true);

-- Do not allow public INSERT/UPDATE/DELETE (handled by Edge Function with service role)
-- No additional policies created for these operations

-- Index to optimize ordering by posted_at
CREATE INDEX IF NOT EXISTS idx_common_good_messages_posted_at
  ON public.common_good_messages (posted_at DESC);
