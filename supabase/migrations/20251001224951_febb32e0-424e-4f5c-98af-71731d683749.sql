-- Improve full-text search for Common Knowledge documents
-- This adds title, description, and tags to the search_text field

-- First, create an improved trigger function for search_text generation
CREATE OR REPLACE FUNCTION public.update_ck_doc_version_search_text()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_record RECORD;
BEGIN
  -- Get document metadata (title, description, tags)
  SELECT title, description, tags
  INTO doc_record
  FROM public.ck_docs
  WHERE id = NEW.doc_id;
  
  -- Generate search_text from title + description + tags + content
  NEW.search_text := to_tsvector('english',
    COALESCE(doc_record.title, '') || ' ' ||
    COALESCE(doc_record.description, '') || ' ' ||
    COALESCE(array_to_string(doc_record.tags, ' '), '') || ' ' ||
    COALESCE(NEW.content_md, '')
  );
  
  RETURN NEW;
END;
$$;

-- Drop old trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_ck_doc_version_search_text_trigger ON public.ck_doc_versions;

CREATE TRIGGER update_ck_doc_version_search_text_trigger
  BEFORE INSERT OR UPDATE OF content_md, doc_id
  ON public.ck_doc_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ck_doc_version_search_text();

-- Also trigger update when document metadata changes
CREATE OR REPLACE FUNCTION public.update_ck_doc_versions_on_doc_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update search_text for all versions of this document
  UPDATE public.ck_doc_versions v
  SET search_text = to_tsvector('english',
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
    COALESCE(v.content_md, '')
  )
  WHERE v.doc_id = NEW.id;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_versions_on_doc_change ON public.ck_docs;

CREATE TRIGGER update_versions_on_doc_change
  AFTER UPDATE OF title, description, tags
  ON public.ck_docs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ck_doc_versions_on_doc_change();

-- Ensure GIN index exists on search_text
CREATE INDEX IF NOT EXISTS idx_ck_doc_versions_search_text 
  ON public.ck_doc_versions 
  USING GIN(search_text);

-- Backfill existing data
UPDATE public.ck_doc_versions v
SET search_text = to_tsvector('english',
  COALESCE(d.title, '') || ' ' ||
  COALESCE(d.description, '') || ' ' ||
  COALESCE(array_to_string(d.tags, ' '), '') || ' ' ||
  COALESCE(v.content_md, '')
)
FROM public.ck_docs d
WHERE v.doc_id = d.id;