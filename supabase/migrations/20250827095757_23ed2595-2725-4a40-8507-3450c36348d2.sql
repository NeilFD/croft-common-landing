-- Add missing INSERT policy for moments bucket to allow users to upload their own photos
CREATE POLICY "Users can upload their own moment photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'moments' 
  AND (auth.uid())::text = (storage.foldername(name))[1]
);