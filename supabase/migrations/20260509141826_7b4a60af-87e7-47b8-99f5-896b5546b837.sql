
-- Add media columns to member_moments for video support
ALTER TABLE public.member_moments
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS poster_url text,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric;

ALTER TABLE public.member_moments
  DROP CONSTRAINT IF EXISTS member_moments_media_type_check;
ALTER TABLE public.member_moments
  ADD CONSTRAINT member_moments_media_type_check CHECK (media_type IN ('image','video'));

-- Comments
CREATE TABLE IF NOT EXISTS public.moment_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid NOT NULL REFERENCES public.member_moments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES public.moment_comments(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT body_len CHECK (char_length(body) BETWEEN 1 AND 500)
);

CREATE INDEX IF NOT EXISTS idx_moment_comments_moment_created
  ON public.moment_comments(moment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_moment_comments_parent
  ON public.moment_comments(parent_id);

ALTER TABLE public.moment_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by authenticated" ON public.moment_comments;
CREATE POLICY "Comments viewable by authenticated"
  ON public.moment_comments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own comments" ON public.moment_comments;
CREATE POLICY "Users insert own comments"
  ON public.moment_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own comments" ON public.moment_comments;
CREATE POLICY "Users update own comments"
  ON public.moment_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own comments" ON public.moment_comments;
CREATE POLICY "Users delete own comments"
  ON public.moment_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_moment_comments_updated ON public.moment_comments;
CREATE TRIGGER trg_moment_comments_updated
  BEFORE UPDATE ON public.moment_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trim/validate body trigger
CREATE OR REPLACE FUNCTION public.moment_comment_normalize()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.body := btrim(NEW.body);
  IF NEW.body IS NULL OR char_length(NEW.body) = 0 THEN
    RAISE EXCEPTION 'Comment cannot be empty';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_moment_comments_normalize ON public.moment_comments;
CREATE TRIGGER trg_moment_comments_normalize
  BEFORE INSERT OR UPDATE OF body ON public.moment_comments
  FOR EACH ROW EXECUTE FUNCTION public.moment_comment_normalize();

-- Reactions
CREATE TABLE IF NOT EXISTS public.moment_comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.moment_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT emoji_allowlist CHECK (emoji IN ('❤️','🔥','😂','👏','🐻','✨')),
  UNIQUE (comment_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_moment_comment_reactions_comment
  ON public.moment_comment_reactions(comment_id);

ALTER TABLE public.moment_comment_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reactions viewable by authenticated" ON public.moment_comment_reactions;
CREATE POLICY "Reactions viewable by authenticated"
  ON public.moment_comment_reactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users insert own reactions" ON public.moment_comment_reactions;
CREATE POLICY "Users insert own reactions"
  ON public.moment_comment_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own reactions" ON public.moment_comment_reactions;
CREATE POLICY "Users delete own reactions"
  ON public.moment_comment_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Realtime
ALTER TABLE public.moment_comments REPLICA IDENTITY FULL;
ALTER TABLE public.moment_comment_reactions REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.moment_comments;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.moment_comment_reactions;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
