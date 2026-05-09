ALTER TABLE public.member_moments ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
CREATE INDEX IF NOT EXISTS idx_member_moments_tags ON public.member_moments USING GIN (tags);