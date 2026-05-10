
ALTER TABLE public.cms_faq_content
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS update_cms_faq_content_updated_at ON public.cms_faq_content;
CREATE TRIGGER update_cms_faq_content_updated_at
BEFORE UPDATE ON public.cms_faq_content
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS cms_faq_content_page_state_idx
  ON public.cms_faq_content (page, published, is_draft, sort_order);

DROP POLICY IF EXISTS "Admins can insert FAQ content" ON public.cms_faq_content;
CREATE POLICY "Admins can insert FAQ content"
  ON public.cms_faq_content FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update FAQ content" ON public.cms_faq_content;
CREATE POLICY "Admins can update FAQ content"
  ON public.cms_faq_content FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete FAQ content" ON public.cms_faq_content;
CREATE POLICY "Admins can delete FAQ content"
  ON public.cms_faq_content FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));
