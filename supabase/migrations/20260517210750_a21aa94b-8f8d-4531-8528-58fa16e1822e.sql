
CREATE TABLE public.cb_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  site text NOT NULL DEFAULT 'both' CHECK (site IN ('town','country','both')),
  starts_at timestamptz,
  ends_at timestamptz,
  poster_url text,
  body text,
  external_url text,
  published boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cb_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cb_events public read published" ON public.cb_events
  FOR SELECT USING (published = true);
CREATE POLICY "cb_events admin all" ON public.cb_events
  FOR ALL TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'super_admin'));
CREATE INDEX cb_events_site_published_idx ON public.cb_events (site, published, starts_at DESC);

CREATE TABLE public.cb_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  body text,
  hero_url text,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cb_stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cb_stories public read published" ON public.cb_stories
  FOR SELECT USING (published = true);
CREATE POLICY "cb_stories admin all" ON public.cb_stories
  FOR ALL TO authenticated
  USING (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_management_role(auth.uid(), 'admin') OR public.has_management_role(auth.uid(), 'super_admin'));
CREATE INDEX cb_stories_published_idx ON public.cb_stories (published, published_at DESC);

CREATE TRIGGER cb_events_updated_at BEFORE UPDATE ON public.cb_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cb_stories_updated_at BEFORE UPDATE ON public.cb_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
