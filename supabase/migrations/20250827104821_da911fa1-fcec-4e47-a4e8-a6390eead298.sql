-- First, ensure the moments bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('moments', 'moments', true)
ON CONFLICT (id) DO NOTHING;

-- Drop all existing INSERT policies for moments bucket to resolve conflicts
DROP POLICY IF EXISTS "Users can upload their own moment photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own moments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their own moments" ON storage.objects;

-- Create a single, clear INSERT policy for moments uploads
CREATE POLICY "Users can upload moments to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'moments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Ensure users can view their own moments
CREATE POLICY "Users can view moments in their own folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'moments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to moments (since bucket is public)
CREATE POLICY "Public can view all moments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'moments');