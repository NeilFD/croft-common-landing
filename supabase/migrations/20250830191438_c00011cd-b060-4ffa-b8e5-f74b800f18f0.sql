-- Ensure the secret_kitchen_access table allows public read access for email checking
-- Drop and recreate the policy to ensure it works properly
DROP POLICY IF EXISTS "Anyone can check email authorization" ON public.secret_kitchen_access;

-- Create a simple policy that allows anyone to read from this table
CREATE POLICY "Public read access for email checking" 
ON public.secret_kitchen_access 
FOR SELECT 
USING (true);