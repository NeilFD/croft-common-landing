
-- Extend cms_images with asset-management fields
ALTER TABLE public.cms_images
  ADD COLUMN IF NOT EXISTS slot text,
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS caption text,
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill: where slot is null, copy section into slot so existing rows still resolve
UPDATE public.cms_images SET slot = section WHERE slot IS NULL;

CREATE INDEX IF NOT EXISTS cms_images_page_slot_idx
  ON public.cms_images (page, slot, published, sort_order);

-- Trigger to keep updated_at fresh on edit
DROP TRIGGER IF EXISTS cms_images_set_updated_at ON public.cms_images;
CREATE TRIGGER cms_images_set_updated_at
  BEFORE UPDATE ON public.cms_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for asset uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('cms-assets', 'cms-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read, admin write
DROP POLICY IF EXISTS "CMS assets are publicly readable" ON storage.objects;
CREATE POLICY "CMS assets are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-assets');

DROP POLICY IF EXISTS "Admins can upload CMS assets" ON storage.objects;
CREATE POLICY "Admins can upload CMS assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cms-assets' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update CMS assets" ON storage.objects;
CREATE POLICY "Admins can update CMS assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'cms-assets' AND public.is_admin(auth.uid()))
  WITH CHECK (bucket_id = 'cms-assets' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete CMS assets" ON storage.objects;
CREATE POLICY "Admins can delete CMS assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cms-assets' AND public.is_admin(auth.uid()));
