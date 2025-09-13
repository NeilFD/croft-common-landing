-- Add cafe page title and subtitle to CMS content
INSERT INTO cms_content (page, section, content_key, content_data, content_type, published, created_by)
VALUES 
  ('cafe', 'header', 'title', '{"text": "Croft Common Café"}', 'text', true, NULL),
  ('cafe', 'header', 'subtitle', '{"text": "Daytime. Bright. Vibrant."}', 'text', true, NULL)
ON CONFLICT (page, section, content_key) 
DO UPDATE SET 
  content_data = EXCLUDED.content_data,
  updated_at = now();