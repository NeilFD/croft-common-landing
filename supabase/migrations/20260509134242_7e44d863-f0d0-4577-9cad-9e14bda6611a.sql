
-- Create the public 'moments' storage bucket used for member moment photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('moments', 'moments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for moments bucket
DROP POLICY IF EXISTS "Moments images are publicly viewable" ON storage.objects;
CREATE POLICY "Moments images are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'moments');

DROP POLICY IF EXISTS "Authenticated users can upload moments" ON storage.objects;
CREATE POLICY "Authenticated users can upload moments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'moments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own moments objects" ON storage.objects;
CREATE POLICY "Users can update their own moments objects"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'moments' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own moments objects" ON storage.objects;
CREATE POLICY "Users can delete their own moments objects"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'moments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow members to update their own moment rows (caption/tags/date edits)
DROP POLICY IF EXISTS "Users can update their own moments" ON public.member_moments;
CREATE POLICY "Users can update their own moments"
ON public.member_moments FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- New moments default to approved + visible (AI pre-check happens before insert)
ALTER TABLE public.member_moments
  ALTER COLUMN moderation_status SET DEFAULT 'approved',
  ALTER COLUMN is_visible SET DEFAULT true;
