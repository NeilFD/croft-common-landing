-- Create contracts storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for contracts bucket
CREATE POLICY "Management users can view contracts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contracts' AND
  (has_management_role(auth.uid(), 'admin') OR 
   has_management_role(auth.uid(), 'sales') OR 
   has_management_role(auth.uid(), 'ops') OR 
   has_management_role(auth.uid(), 'finance') OR 
   has_management_role(auth.uid(), 'readonly'))
);

CREATE POLICY "Management users can upload contracts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contracts' AND
  (has_management_role(auth.uid(), 'admin') OR 
   has_management_role(auth.uid(), 'sales'))
);

CREATE POLICY "Management users can update contracts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contracts' AND
  (has_management_role(auth.uid(), 'admin') OR 
   has_management_role(auth.uid(), 'sales'))
);

CREATE POLICY "Management users can delete contracts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contracts' AND
  (has_management_role(auth.uid(), 'admin') OR 
   has_management_role(auth.uid(), 'sales'))
);