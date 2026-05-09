ALTER TABLE public.cb_members
  ADD COLUMN IF NOT EXISTS wallet_pass_serial_number text,
  ADD COLUMN IF NOT EXISTS wallet_pass_last_issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS wallet_pass_revoked boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cb_members_wallet_serial
  ON public.cb_members(wallet_pass_serial_number)
  WHERE wallet_pass_serial_number IS NOT NULL;