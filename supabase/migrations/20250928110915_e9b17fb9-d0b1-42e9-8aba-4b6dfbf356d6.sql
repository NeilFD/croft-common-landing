-- Create proposal_pdfs table for tracking generated PDF files
CREATE TABLE public.proposal_pdfs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.management_events(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  public_url text NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proposal_pdfs ENABLE ROW LEVEL SECURITY;

-- Create policies for proposal_pdfs
CREATE POLICY "Management users can view proposal PDFs"
  ON public.proposal_pdfs
  FOR SELECT
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR 
    has_management_role(auth.uid(), 'sales'::management_role) OR 
    has_management_role(auth.uid(), 'ops'::management_role) OR 
    has_management_role(auth.uid(), 'finance'::management_role) OR 
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

CREATE POLICY "Management users can create proposal PDFs"
  ON public.proposal_pdfs
  FOR INSERT
  WITH CHECK (
    has_management_role(auth.uid(), 'admin'::management_role) OR 
    has_management_role(auth.uid(), 'sales'::management_role)
  );

-- Create storage bucket for proposals
INSERT INTO storage.buckets (id, name, public) VALUES ('proposals', 'proposals', true);

-- Create storage policies for proposals bucket
CREATE POLICY "Management users can upload proposal PDFs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'proposals' AND
    (has_management_role(auth.uid(), 'admin'::management_role) OR 
     has_management_role(auth.uid(), 'sales'::management_role))
  );

CREATE POLICY "Public can view proposal PDFs"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'proposals');