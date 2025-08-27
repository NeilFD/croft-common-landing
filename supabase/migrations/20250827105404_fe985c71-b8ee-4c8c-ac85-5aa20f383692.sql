-- Fix the INSERT policy for moments bucket
DROP POLICY "Users can upload moments to their own folder" ON storage.objects;

-- Create correct INSERT policy
CREATE POLICY "Users can upload moments to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'moments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.uid() IS NOT NULL
);