-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "CMS content - allowed domain users can view" ON public.cms_content;

-- Create a new policy that allows public access to published content
CREATE POLICY "Public can view published CMS content" 
ON public.cms_content 
FOR SELECT 
USING (published = true);

-- Create a separate policy for admin users to view all content (including unpublished)
CREATE POLICY "CMS content - allowed domain users can view all" 
ON public.cms_content 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));