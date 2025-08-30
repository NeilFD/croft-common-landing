-- Drop the restrictive RLS policy that only allows neil@cityandsanctuary.com
DROP POLICY IF EXISTS "Only Neil can view secret kitchen access" ON public.secret_kitchen_access;

-- Create a new policy that allows anyone to check email authorization
CREATE POLICY "Anyone can check email authorization" 
ON public.secret_kitchen_access 
FOR SELECT 
USING (true);