CREATE OR REPLACE FUNCTION public.seed_seo_page(
  p_route text,
  p_title text,
  p_description text,
  p_noindex boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.seo_pages (route, title, description, noindex)
  VALUES (p_route, p_title, p_description, p_noindex)
  ON CONFLICT (route) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.seed_seo_page(text, text, text, boolean) TO authenticated;