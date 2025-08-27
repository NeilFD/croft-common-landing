-- Remove the conflicting ALL policy that's causing RLS violations
DROP POLICY IF EXISTS "Admins can manage all moment photos" ON storage.objects;

-- Create separate admin policies that don't interfere with regular user uploads
CREATE POLICY "Admins can view all moment photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'moments' 
  AND is_email_domain_allowed(get_user_email())
);

CREATE POLICY "Admins can update moment photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'moments' 
  AND is_email_domain_allowed(get_user_email())
);

CREATE POLICY "Admins can delete moment photos" 
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'moments' 
  AND is_email_domain_allowed(get_user_email())
);