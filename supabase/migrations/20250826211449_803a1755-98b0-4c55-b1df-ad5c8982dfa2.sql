-- Create storage bucket for member moments if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('moments', 'moments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for member moments
CREATE POLICY "Users can upload their own moments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'moments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view moment images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'moments');

CREATE POLICY "Users can update their own moment images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'moments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own moment images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'moments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);