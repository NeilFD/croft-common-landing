-- Enable RLS on management_events table and create policies
ALTER TABLE public.management_events ENABLE ROW LEVEL SECURITY;

-- Management users can view all events
CREATE POLICY "Management users can view all events"
  ON public.management_events 
  FOR SELECT 
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR 
    has_management_role(auth.uid(), 'sales'::management_role) OR 
    has_management_role(auth.uid(), 'ops'::management_role) OR 
    has_management_role(auth.uid(), 'finance'::management_role) OR 
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

-- Admin and sales can create events
CREATE POLICY "Admin and sales can create events"
  ON public.management_events 
  FOR INSERT 
  WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR 
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- Admin and sales can update events
CREATE POLICY "Admin and sales can update events"
  ON public.management_events 
  FOR UPDATE 
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR 
    has_management_role(auth.uid(), 'sales'::management_role)
  )
  WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR 
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- Only admin can delete events
CREATE POLICY "Admin can delete events"
  ON public.management_events 
  FOR DELETE 
  USING (
    has_management_role(auth.uid(), 'admin'::management_role)
  );