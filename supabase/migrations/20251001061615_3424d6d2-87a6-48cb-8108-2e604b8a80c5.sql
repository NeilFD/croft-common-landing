-- Create trigger function to automatically extract document content when files are uploaded
CREATE OR REPLACE FUNCTION public.trigger_auto_extract_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get configuration
  SELECT value INTO supabase_url FROM public.app_settings WHERE key = 'supabase_url';
  SELECT value INTO service_role_key FROM public.app_settings WHERE key = 'service_role_key';
  
  -- Only proceed if we have valid configuration
  IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL AND service_role_key != 'PLACEHOLDER_FOR_SERVICE_ROLE_KEY' THEN
    -- Call the extraction function asynchronously
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/extract-document-content',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'storagePath', NEW.storage_path,
        'docId', NEW.doc_id,
        'versionId', NEW.version_id
      )
    );
    
    RAISE NOTICE 'Auto-extraction triggered for file %', NEW.id;
  ELSE
    RAISE WARNING 'Auto-extraction not configured properly for file %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on ck_files table
DROP TRIGGER IF EXISTS auto_extract_on_file_upload ON public.ck_files;
CREATE TRIGGER auto_extract_on_file_upload
  AFTER INSERT ON public.ck_files
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_extract_document();

COMMENT ON FUNCTION public.trigger_auto_extract_document IS 'Automatically triggers document content extraction when a file is uploaded to Common Knowledge';
COMMENT ON TRIGGER auto_extract_on_file_upload ON public.ck_files IS 'Automatically extracts document content when files are uploaded';