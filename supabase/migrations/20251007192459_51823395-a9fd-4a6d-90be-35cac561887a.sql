-- Make client-files bucket public so uploaded inspiration images can be displayed
UPDATE storage.buckets 
SET public = true 
WHERE id = 'client-files';