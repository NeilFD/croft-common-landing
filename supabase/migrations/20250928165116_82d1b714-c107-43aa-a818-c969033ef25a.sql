-- Make contracts bucket public for downloads
UPDATE storage.buckets 
SET public = true 
WHERE id = 'contracts';

-- Create RLS policies for contracts bucket
CREATE POLICY "Contracts are publicly accessible for download" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'contracts');

CREATE POLICY "Staff can upload contracts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'contracts' AND auth.role() = 'authenticated');