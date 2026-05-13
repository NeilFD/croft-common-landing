
-- Channels
CREATE TABLE public.marketing_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  type text NOT NULL DEFAULT 'social',
  accent_color text,
  character_limit integer,
  image_aspects text[] DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Campaigns
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  goal text,
  kpi text,
  budget numeric,
  start_date date,
  end_date date,
  hero_asset_id uuid,
  owner_id uuid,
  status text NOT NULL DEFAULT 'planning',
  colour text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Posts
CREATE TABLE public.marketing_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
  title text,
  body text,
  cta_text text,
  cta_url text,
  hashtags text[] DEFAULT '{}',
  scheduled_at timestamptz,
  timezone text NOT NULL DEFAULT 'Europe/London',
  status text NOT NULL DEFAULT 'draft',
  owner_id uuid,
  property_tag text,
  content_pillar text,
  locale text NOT NULL DEFAULT 'en-GB',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  search_tsv tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_posts_scheduled ON public.marketing_posts(scheduled_at);
CREATE INDEX idx_marketing_posts_status ON public.marketing_posts(status);
CREATE INDEX idx_marketing_posts_campaign ON public.marketing_posts(campaign_id);
CREATE INDEX idx_marketing_posts_search ON public.marketing_posts USING gin(search_tsv);

-- Per-channel variations
CREATE TABLE public.marketing_post_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
  channel_key text NOT NULL,
  body_override text,
  media_override jsonb,
  status_override text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, channel_key)
);

-- Assets
CREATE TABLE public.marketing_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  kind text NOT NULL DEFAULT 'image',
  width integer,
  height integer,
  alt_text text,
  tags text[] DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.marketing_post_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.marketing_assets(id) ON DELETE CASCADE,
  channel_key text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Hashtag sets
CREATE TABLE public.marketing_hashtag_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
CREATE TABLE public.marketing_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.marketing_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  mentions uuid[] DEFAULT '{}',
  pin jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_comments_post ON public.marketing_comments(post_id);

-- Versions
CREATE TABLE public.marketing_post_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Status log
CREATE TABLE public.marketing_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.marketing_posts(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  author_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Saved views
CREATE TABLE public.marketing_saved_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Holidays
CREATE TABLE public.marketing_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  label text NOT NULL,
  country text NOT NULL DEFAULT 'GB',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Search tsv trigger
CREATE OR REPLACE FUNCTION public.set_marketing_post_search_tsv()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_tsv :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.body, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.hashtags, ' '), '')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_marketing_posts_tsv
BEFORE INSERT OR UPDATE ON public.marketing_posts
FOR EACH ROW EXECUTE FUNCTION public.set_marketing_post_search_tsv();

CREATE TRIGGER trg_marketing_campaigns_updated
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Status change logger
CREATE OR REPLACE FUNCTION public.log_marketing_post_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Enforce admin-only Approved transition
    IF NEW.status = 'approved' AND NOT public.has_management_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admin can approve posts';
    END IF;
    INSERT INTO public.marketing_status_log(post_id, from_status, to_status, author_id)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_marketing_posts_status_log
AFTER UPDATE ON public.marketing_posts
FOR EACH ROW EXECUTE FUNCTION public.log_marketing_post_status_change();

-- Enable RLS
ALTER TABLE public.marketing_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_post_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_post_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_hashtag_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_post_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_saved_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_holidays ENABLE ROW LEVEL SECURITY;

-- Helpers
CREATE OR REPLACE FUNCTION public.is_management_user(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid);
$$;

CREATE OR REPLACE FUNCTION public.can_edit_marketing(_uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_management_role(_uid, 'admin') OR public.has_management_role(_uid, 'sales');
$$;

-- Read policies (any management role)
CREATE POLICY "mkt_channels_read" ON public.marketing_channels FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_campaigns_read" ON public.marketing_campaigns FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_posts_read" ON public.marketing_posts FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_post_channels_read" ON public.marketing_post_channels FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_assets_read" ON public.marketing_assets FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_post_assets_read" ON public.marketing_post_assets FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_hashtag_sets_read" ON public.marketing_hashtag_sets FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_comments_read" ON public.marketing_comments FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_versions_read" ON public.marketing_post_versions FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_status_log_read" ON public.marketing_status_log FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));
CREATE POLICY "mkt_holidays_read" ON public.marketing_holidays FOR SELECT TO authenticated USING (public.is_management_user(auth.uid()));

-- Write policies: admin/sales for posts, campaigns, assets, hashtag sets, comments, versions, post_channels, post_assets
CREATE POLICY "mkt_posts_insert" ON public.marketing_posts FOR INSERT TO authenticated WITH CHECK (public.can_edit_marketing(auth.uid()));
CREATE POLICY "mkt_posts_update" ON public.marketing_posts FOR UPDATE TO authenticated USING (public.can_edit_marketing(auth.uid())) WITH CHECK (public.can_edit_marketing(auth.uid()));
CREATE POLICY "mkt_posts_delete" ON public.marketing_posts FOR DELETE TO authenticated USING (public.has_management_role(auth.uid(), 'admin'));

CREATE POLICY "mkt_campaigns_insert" ON public.marketing_campaigns FOR INSERT TO authenticated WITH CHECK (public.can_edit_marketing(auth.uid()));
CREATE POLICY "mkt_campaigns_update" ON public.marketing_campaigns FOR UPDATE TO authenticated USING (public.can_edit_marketing(auth.uid())) WITH CHECK (public.can_edit_marketing(auth.uid()));
CREATE POLICY "mkt_campaigns_delete" ON public.marketing_campaigns FOR DELETE TO authenticated USING (public.has_management_role(auth.uid(), 'admin'));

CREATE POLICY "mkt_post_channels_write" ON public.marketing_post_channels FOR ALL TO authenticated USING (public.can_edit_marketing(auth.uid())) WITH CHECK (public.can_edit_marketing(auth.uid()));
CREATE POLICY "mkt_post_assets_write" ON public.marketing_post_assets FOR ALL TO authenticated USING (public.can_edit_marketing(auth.uid())) WITH CHECK (public.can_edit_marketing(auth.uid()));
CREATE POLICY "mkt_assets_write" ON public.marketing_assets FOR ALL TO authenticated USING (public.can_edit_marketing(auth.uid())) WITH CHECK (public.can_edit_marketing(auth.uid()));
CREATE POLICY "mkt_hashtag_sets_write" ON public.marketing_hashtag_sets FOR ALL TO authenticated USING (public.can_edit_marketing(auth.uid())) WITH CHECK (public.can_edit_marketing(auth.uid()));

-- Comments: any management user can comment
CREATE POLICY "mkt_comments_insert" ON public.marketing_comments FOR INSERT TO authenticated WITH CHECK (public.is_management_user(auth.uid()) AND author_id = auth.uid());
CREATE POLICY "mkt_comments_update" ON public.marketing_comments FOR UPDATE TO authenticated USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
CREATE POLICY "mkt_comments_delete" ON public.marketing_comments FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_management_role(auth.uid(), 'admin'));

CREATE POLICY "mkt_versions_insert" ON public.marketing_post_versions FOR INSERT TO authenticated WITH CHECK (public.can_edit_marketing(auth.uid()));

-- Admin-only management
CREATE POLICY "mkt_channels_write" ON public.marketing_channels FOR ALL TO authenticated USING (public.has_management_role(auth.uid(), 'admin')) WITH CHECK (public.has_management_role(auth.uid(), 'admin'));
CREATE POLICY "mkt_holidays_write" ON public.marketing_holidays FOR ALL TO authenticated USING (public.has_management_role(auth.uid(), 'admin')) WITH CHECK (public.has_management_role(auth.uid(), 'admin'));

-- Saved views: per-user
CREATE POLICY "mkt_saved_views_select" ON public.marketing_saved_views FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "mkt_saved_views_write" ON public.marketing_saved_views FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-assets', 'marketing-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "marketing_assets_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketing-assets');

CREATE POLICY "marketing_assets_write"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'marketing-assets' AND public.can_edit_marketing(auth.uid()));

CREATE POLICY "marketing_assets_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'marketing-assets' AND public.can_edit_marketing(auth.uid()));

CREATE POLICY "marketing_assets_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'marketing-assets' AND public.can_edit_marketing(auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_status_log;

-- Seed channels
INSERT INTO public.marketing_channels (key, label, type, accent_color, character_limit, image_aspects, sort_order) VALUES
  ('instagram', 'Instagram', 'social', '#E1306C', 2200, ARRAY['1:1','4:5','9:16'], 1),
  ('tiktok', 'TikTok', 'social', '#000000', 2200, ARRAY['9:16'], 2),
  ('facebook', 'Facebook', 'social', '#1877F2', 63206, ARRAY['1:1','4:5','16:9'], 3),
  ('x', 'X', 'social', '#000000', 280, ARRAY['16:9','1:1'], 4),
  ('linkedin', 'LinkedIn', 'social', '#0A66C2', 3000, ARRAY['1:1','16:9'], 5),
  ('email', 'Email', 'email', '#FF1F8F', NULL, ARRAY['16:9'], 6),
  ('website', 'Website', 'web', '#000000', NULL, ARRAY['16:9','1:1'], 7)
ON CONFLICT (key) DO NOTHING;
