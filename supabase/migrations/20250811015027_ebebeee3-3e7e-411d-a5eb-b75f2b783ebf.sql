-- Create membership link tables for passkey-to-email verification
CREATE TABLE IF NOT EXISTS public.membership_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_handle TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_links_email ON public.membership_links (lower(email));

-- Store one-time codes for email verification
CREATE TABLE IF NOT EXISTS public.membership_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_handle TEXT NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  consumed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_membership_codes_lookup 
  ON public.membership_codes (user_handle, lower(email), code, consumed, expires_at);

-- Enable RLS with strict policies (no direct access from client)
ALTER TABLE public.membership_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'membership_links' AND policyname = 'No direct access'
  ) THEN
    CREATE POLICY "No direct access" ON public.membership_links
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'membership_codes' AND policyname = 'No direct access'
  ) THEN
    CREATE POLICY "No direct access" ON public.membership_codes
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;