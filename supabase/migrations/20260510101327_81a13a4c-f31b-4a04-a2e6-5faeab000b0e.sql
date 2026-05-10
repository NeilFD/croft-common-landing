CREATE TABLE IF NOT EXISTS public.cms_list_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page text NOT NULL,
  section text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  heading text,
  body text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  published boolean NOT NULL DEFAULT false,
  is_draft boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cms_list_items_page_section_idx
  ON public.cms_list_items (page, section, published, is_draft, sort_order);

DROP TRIGGER IF EXISTS update_cms_list_items_updated_at ON public.cms_list_items;
CREATE TRIGGER update_cms_list_items_updated_at
BEFORE UPDATE ON public.cms_list_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cms_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published list items" ON public.cms_list_items;
CREATE POLICY "Anyone can read published list items"
  ON public.cms_list_items FOR SELECT TO anon, authenticated
  USING (published = true AND is_draft = false);

DROP POLICY IF EXISTS "Admins can read all list items" ON public.cms_list_items;
CREATE POLICY "Admins can read all list items"
  ON public.cms_list_items FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert list items" ON public.cms_list_items;
CREATE POLICY "Admins can insert list items"
  ON public.cms_list_items FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update list items" ON public.cms_list_items;
CREATE POLICY "Admins can update list items"
  ON public.cms_list_items FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete list items" ON public.cms_list_items;
CREATE POLICY "Admins can delete list items"
  ON public.cms_list_items FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));