-- Add proposal versioning and BEO-Proposal linking

-- Create proposal_versions table to track proposal iterations
CREATE TABLE IF NOT EXISTS public.proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.management_events(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  beo_version_id UUID REFERENCES public.event_beo_versions(id) ON DELETE SET NULL,
  pdf_url TEXT,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, approved, superseded
  client_viewed_at TIMESTAMPTZ,
  client_approved_at TIMESTAMPTZ,
  notes TEXT,
  content_snapshot JSONB NOT NULL DEFAULT '{}', -- Store proposal content at this version
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, version_no)
);

-- Add RLS policies for proposal_versions
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Management users can view proposal versions"
  ON public.proposal_versions FOR SELECT
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

CREATE POLICY "Admin/Sales can create proposal versions"
  ON public.proposal_versions FOR INSERT
  WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

CREATE POLICY "Admin/Sales can update proposal versions"
  ON public.proposal_versions FOR UPDATE
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_proposal_versions_event_id ON public.proposal_versions(event_id);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_beo_version_id ON public.proposal_versions(beo_version_id);

-- Add a column to management_events to track current proposal version
ALTER TABLE public.management_events 
ADD COLUMN IF NOT EXISTS current_proposal_version_id UUID REFERENCES public.proposal_versions(id) ON DELETE SET NULL;