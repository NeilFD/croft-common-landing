-- Create storage bucket for CMS images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cms-images', 'cms-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Create RLS policies for cms-images bucket
CREATE POLICY "Allowed domain users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cms-images' AND
  auth.uid() IS NOT NULL AND
  is_email_domain_allowed(get_user_email())
);

CREATE POLICY "Allowed domain users can view images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cms-images' AND
  auth.uid() IS NOT NULL AND
  is_email_domain_allowed(get_user_email())
);

CREATE POLICY "Allowed domain users can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cms-images' AND
  auth.uid() IS NOT NULL AND
  is_email_domain_allowed(get_user_email())
);

CREATE POLICY "Allowed domain users can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cms-images' AND
  auth.uid() IS NOT NULL AND
  is_email_domain_allowed(get_user_email())
);

-- Public access for published images
CREATE POLICY "Public can view published images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cms-images');