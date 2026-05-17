-- Journal/blog posts table (mirrors cb_stories pattern)
CREATE TABLE public.cb_journal_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body TEXT,
  hero_url TEXT,
  author TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  site_scope TEXT NOT NULL DEFAULT 'both' CHECK (site_scope IN ('both','town','country')),
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX cb_journal_posts_published_idx
  ON public.cb_journal_posts (published, published_at DESC);

ALTER TABLE public.cb_journal_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_journal_posts public read published"
  ON public.cb_journal_posts FOR SELECT
  USING (published = true);

CREATE POLICY "cb_journal_posts admin all"
  ON public.cb_journal_posts
  TO authenticated
  USING (
    public.has_management_role(auth.uid(), 'admin')
    OR public.has_management_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    public.has_management_role(auth.uid(), 'admin')
    OR public.has_management_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER cb_journal_posts_updated_at
  BEFORE UPDATE ON public.cb_journal_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();