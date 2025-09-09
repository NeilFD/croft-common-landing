-- Create storage bucket for lunch menu images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lunch-images', 'lunch-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for lunch images
CREATE POLICY "Lunch images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'lunch-images');

CREATE POLICY "Admins can upload lunch images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'lunch-images' AND is_email_domain_allowed(get_user_email()));