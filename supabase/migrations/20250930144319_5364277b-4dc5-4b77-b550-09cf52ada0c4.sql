-- Create storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('invoice-documents', 'invoice-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for invoice-documents bucket
CREATE POLICY "Public can view invoice documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-documents');

CREATE POLICY "Management users can upload invoice documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'invoice-documents' 
  AND is_email_domain_allowed(get_user_email())
);

CREATE POLICY "Management users can update invoice documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'invoice-documents' 
  AND is_email_domain_allowed(get_user_email())
);

CREATE POLICY "Management users can delete invoice documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'invoice-documents' 
  AND is_email_domain_allowed(get_user_email())
);

-- Add fields to invoices table for tracking email sending
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_to TEXT;