-- Update the SELECT policy to allow everyone to view all events
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;

-- Create new policy that allows everyone to view all events
CREATE POLICY "Everyone can view all events" 
ON public.events 
FOR SELECT 
USING (true);