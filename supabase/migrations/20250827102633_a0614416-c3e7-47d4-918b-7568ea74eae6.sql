-- Create a simple INSERT policy for authenticated users uploading their own moments
CREATE POLICY "Authenticated users can upload their own moments"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'moments' 
  AND auth.uid() IS NOT NULL 
  AND (storage.foldername(name))[1] = auth.uid()::text
);