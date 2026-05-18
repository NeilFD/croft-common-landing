
-- Additive columns on cb_events
ALTER TABLE public.cb_events
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text;

-- Additive columns on cb_journal_posts
ALTER TABLE public.cb_journal_posts
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text,
  ADD COLUMN IF NOT EXISTS reading_minutes integer;

-- Additive columns on cb_stories
ALTER TABLE public.cb_stories
  ADD COLUMN IF NOT EXISTS subtitle text,
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text;

-- Storage bucket for CMS content uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('cb-content', 'cb-content', true)
ON CONFLICT (id) DO NOTHING;

-- Public read of cb-content
DROP POLICY IF EXISTS "cb-content public read" ON storage.objects;
CREATE POLICY "cb-content public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'cb-content');

-- Admin write of cb-content
DROP POLICY IF EXISTS "cb-content admin insert" ON storage.objects;
CREATE POLICY "cb-content admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cb-content'
  AND (
    public.has_management_role(auth.uid(), 'admin')
    OR public.has_management_role(auth.uid(), 'super_admin')
  )
);

DROP POLICY IF EXISTS "cb-content admin update" ON storage.objects;
CREATE POLICY "cb-content admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'cb-content'
  AND (
    public.has_management_role(auth.uid(), 'admin')
    OR public.has_management_role(auth.uid(), 'super_admin')
  )
);

DROP POLICY IF EXISTS "cb-content admin delete" ON storage.objects;
CREATE POLICY "cb-content admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'cb-content'
  AND (
    public.has_management_role(auth.uid(), 'admin')
    OR public.has_management_role(auth.uid(), 'super_admin')
  )
);
