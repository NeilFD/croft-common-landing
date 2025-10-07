-- Create client inspiration links table
CREATE TABLE public.client_inspiration_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.management_events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  link_type TEXT NOT NULL CHECK (link_type IN ('instagram', 'pinterest', 'web')),
  title TEXT,
  description TEXT,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.client_inspiration_links ENABLE ROW LEVEL SECURITY;

-- Clients can view inspiration links for their event
CREATE POLICY "Clients can view inspiration links for their event"
ON public.client_inspiration_links
FOR SELECT
USING (event_id = get_client_event_id());

-- Clients can add inspiration links for their event
CREATE POLICY "Clients can add inspiration links for their event"
ON public.client_inspiration_links
FOR INSERT
WITH CHECK (event_id = get_client_event_id());

-- Clients can delete their own inspiration links
CREATE POLICY "Clients can delete their own inspiration links"
ON public.client_inspiration_links
FOR DELETE
USING (event_id = get_client_event_id());

-- Management can view all inspiration links
CREATE POLICY "Management can view all inspiration links"
ON public.client_inspiration_links
FOR SELECT
USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role)
);

-- Management can delete inspiration links
CREATE POLICY "Management can delete inspiration links"
ON public.client_inspiration_links
FOR DELETE
USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role)
);

-- Create index for faster queries
CREATE INDEX idx_client_inspiration_links_event_id ON public.client_inspiration_links(event_id);
CREATE INDEX idx_client_inspiration_links_created_at ON public.client_inspiration_links(created_at DESC);