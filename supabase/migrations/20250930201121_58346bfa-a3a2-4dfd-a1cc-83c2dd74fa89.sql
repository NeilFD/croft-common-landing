-- Update the rpc_ck_create_doc function to accept collection_id parameter
CREATE OR REPLACE FUNCTION public.rpc_ck_create_doc(
  p_title TEXT,
  p_slug TEXT,
  p_type TEXT,
  p_content_md TEXT,
  p_collection_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doc_id UUID;
  v_version_id UUID;
  v_owner_id UUID;
BEGIN
  -- Get the current user's ID
  v_owner_id := auth.uid();
  
  -- Insert the document
  INSERT INTO public.ck_docs (title, slug, type, status, owner_id, collection_id)
  VALUES (p_title, p_slug, p_type::doc_type, 'draft', v_owner_id, p_collection_id)
  RETURNING id INTO v_doc_id;
  
  -- Create initial version
  INSERT INTO public.ck_doc_versions (doc_id, version_no, content_md, summary)
  VALUES (v_doc_id, 1, p_content_md, p_title)
  RETURNING id INTO v_version_id;
  
  -- Update document with current version
  UPDATE public.ck_docs
  SET version_current_id = v_version_id
  WHERE id = v_doc_id;
  
  RETURN v_doc_id;
END;
$$;