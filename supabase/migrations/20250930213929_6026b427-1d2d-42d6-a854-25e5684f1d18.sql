-- Create function to automatically populate search_text for Common Knowledge documents
CREATE OR REPLACE FUNCTION public.update_ck_doc_version_search_text()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Automatically populate the search_text tsvector from content_md and doc metadata
  NEW.search_text := 
    setweight(to_tsvector('english', COALESCE((SELECT title FROM public.ck_docs WHERE id = NEW.doc_id), '')), 'A') ||
    setweight(to_tsvector('english', COALESCE((SELECT description FROM public.ck_docs WHERE id = NEW.doc_id), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content_md, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string((SELECT tags FROM public.ck_docs WHERE id = NEW.doc_id), ' '), '')), 'B');
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update search_text on insert or update
DROP TRIGGER IF EXISTS trigger_update_ck_doc_version_search_text ON public.ck_doc_versions;

CREATE TRIGGER trigger_update_ck_doc_version_search_text
  BEFORE INSERT OR UPDATE ON public.ck_doc_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ck_doc_version_search_text();

-- Backfill existing documents to ensure they're all searchable
UPDATE public.ck_doc_versions
SET search_text = 
  setweight(to_tsvector('english', COALESCE((SELECT title FROM public.ck_docs WHERE id = doc_id), '')), 'A') ||
  setweight(to_tsvector('english', COALESCE((SELECT description FROM public.ck_docs WHERE id = doc_id), '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(content_md, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(summary, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string((SELECT tags FROM public.ck_docs WHERE id = doc_id), ' '), '')), 'B')
WHERE search_text IS NULL OR search_text = to_tsvector('english', '');

-- Create optimized index for full-text search if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_ck_doc_versions_search_text_gin 
  ON public.ck_doc_versions 
  USING GIN (search_text);