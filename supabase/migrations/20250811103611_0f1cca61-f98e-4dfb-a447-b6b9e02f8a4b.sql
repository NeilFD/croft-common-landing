
-- Add rp_id to link credentials to the relying party (domain) they belong to
ALTER TABLE public.webauthn_credentials
ADD COLUMN IF NOT EXISTS rp_id text;

-- Helpful index for lookups during auth options
CREATE INDEX IF NOT EXISTS webauthn_credentials_user_rp_idx
  ON public.webauthn_credentials (user_handle, rp_id);
