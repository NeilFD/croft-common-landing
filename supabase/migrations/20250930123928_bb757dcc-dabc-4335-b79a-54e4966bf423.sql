-- Create event_contacts table for managing all contact information for events
CREATE TABLE IF NOT EXISTS public.event_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.management_events(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('primary', 'management', 'emergency', 'vendor')),
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_contacts_event_id ON public.event_contacts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_contacts_type ON public.event_contacts(contact_type);

-- Enable RLS
ALTER TABLE public.event_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_contacts
CREATE POLICY "Management users can view event contacts"
  ON public.event_contacts
  FOR SELECT
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

CREATE POLICY "Admin/Sales/Ops can manage event contacts"
  ON public.event_contacts
  FOR ALL
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role)
  )
  WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role)
  );

-- Add trigger for updated_at
CREATE TRIGGER update_event_contacts_updated_at
  BEFORE UPDATE ON public.event_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();