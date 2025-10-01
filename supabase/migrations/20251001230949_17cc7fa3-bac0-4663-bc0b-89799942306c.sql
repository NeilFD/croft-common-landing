-- Add SELECT policies for management users on Common Knowledge tables

-- Policy for ck_docs: Allow management users to view all approved docs
CREATE POLICY "Management users can view all docs"
ON public.ck_docs
FOR SELECT
TO authenticated
USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role) OR
  ck_has_doc_access(id, auth.uid(), 'view'::ck_share_level)
);

-- Policy for ck_doc_versions: Allow management users to view all versions
CREATE POLICY "Management users can view all versions"
ON public.ck_doc_versions
FOR SELECT
TO authenticated
USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role) OR
  ck_has_doc_access(doc_id, auth.uid(), 'view'::ck_share_level)
);

-- Policy for ck_files: Allow management users to view all files
CREATE POLICY "Management users can view all files"
ON public.ck_files
FOR SELECT
TO authenticated
USING (
  has_management_role(auth.uid(), 'admin'::management_role) OR
  has_management_role(auth.uid(), 'sales'::management_role) OR
  has_management_role(auth.uid(), 'ops'::management_role) OR
  has_management_role(auth.uid(), 'finance'::management_role) OR
  has_management_role(auth.uid(), 'readonly'::management_role) OR
  ck_has_doc_access(doc_id, auth.uid(), 'view'::ck_share_level)
);