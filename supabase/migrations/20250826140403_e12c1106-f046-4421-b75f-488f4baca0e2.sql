UPDATE cms_content SET 
  content_data = jsonb_set(content_data, '{text}', '"MORE"'),
  published = true,
  updated_at = now()
WHERE page = 'global' AND section = 'buttons' AND content_key = 'open';