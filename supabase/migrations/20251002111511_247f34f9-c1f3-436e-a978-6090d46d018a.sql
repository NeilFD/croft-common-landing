-- Create event_venue_hire table for managing venue hire details
CREATE TABLE IF NOT EXISTS public.event_venue_hire (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  venue_name TEXT NOT NULL,
  hire_cost NUMERIC(10,2) DEFAULT 0,
  vat_rate NUMERIC(5,2) DEFAULT 20.00,
  setup_time TIME,
  breakdown_time TIME,
  capacity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.event_venue_hire ENABLE ROW LEVEL SECURITY;

-- Management users can view venue hire
CREATE POLICY "Management users can view venue hire"
ON public.event_venue_hire
FOR SELECT
USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role)
);

-- Admin/Sales can insert venue hire
CREATE POLICY "Admin/Sales can insert venue hire"
ON public.event_venue_hire
FOR INSERT
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role)
);

-- Admin/Sales can update venue hire
CREATE POLICY "Admin/Sales can update venue hire"
ON public.event_venue_hire
FOR UPDATE
USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role)
)
WITH CHECK (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role)
);

-- Admin can delete venue hire
CREATE POLICY "Admin can delete venue hire"
ON public.event_venue_hire
FOR DELETE
USING (has_management_role(auth.uid(), 'admin'::management_role));

-- Add trigger for updated_at
CREATE TRIGGER update_event_venue_hire_updated_at
  BEFORE UPDATE ON public.event_venue_hire
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();