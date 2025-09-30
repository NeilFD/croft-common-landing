-- Create a SECURITY DEFINER function to safely update doc content from the client for authorised users
CREATE OR REPLACE FUNCTION public.admin_update_doc_content(
  p_version_id uuid,
  p_content_md text,
  p_summary text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow only internal users (same rule as admin features)
  IF NOT is_email_domain_allowed(get_user_email()) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  UPDATE public.ck_doc_versions
  SET 
    content_md = p_content_md,
    summary = COALESCE(p_summary, LEFT(p_content_md, 500)),
    search_text = to_tsvector('english', COALESCE(p_content_md, ''))
  WHERE id = p_version_id;

  RETURN FOUND;
END;
$$;

-- Ensure authenticated users can call the function
GRANT EXECUTE ON FUNCTION public.admin_update_doc_content(uuid, text, text) TO authenticated;