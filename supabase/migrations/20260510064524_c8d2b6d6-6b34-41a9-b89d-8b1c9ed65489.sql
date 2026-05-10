
-- 1. Admin helper based on allowed email domain
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    JOIN public.allowed_domains d
      ON split_part(u.email, '@', 2) = d.domain
    WHERE u.id = uid
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

-- 2. profiles: lock to owner/admin, expose safe fields via view
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Owner can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT user_id, first_name, last_name, avatar_url
  FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- The view uses security_invoker so it relies on RLS of underlying table.
-- We need a SELECT policy that allows authenticated users to read the safe columns.
-- Add a permissive policy specifically for the safe-field view path: allow authenticated read of all rows
-- but only the view exposes the limited columns. Since RLS is row-level not column-level, we add a policy.
CREATE POLICY "Authenticated can read profiles for safe view"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Note: this policy combined with the view means signed-in users could still query the base
-- table directly and see PII. To prevent that, restrict via separate column-aware approach:
-- Drop the broad policy; instead, expose data through a SECURITY DEFINER function used by the view.
DROP POLICY "Authenticated can read profiles for safe view" ON public.profiles;

-- Recreate the view as SECURITY DEFINER style by backing it with a function
DROP VIEW IF EXISTS public.profiles_public;

CREATE OR REPLACE FUNCTION public.get_profiles_public(uids uuid[])
RETURNS TABLE(user_id uuid, first_name text, last_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.first_name, p.last_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(uids)
$$;

REVOKE EXECUTE ON FUNCTION public.get_profiles_public(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_profiles_public(uuid[]) TO authenticated, service_role;

-- Also create a view for convenient SELECT use (security_definer via owner)
CREATE VIEW public.profiles_public
WITH (security_invoker = off) AS
  SELECT user_id, first_name, last_name, avatar_url
  FROM public.profiles;

ALTER VIEW public.profiles_public OWNER TO postgres;
REVOKE ALL ON public.profiles_public FROM anon;
GRANT SELECT ON public.profiles_public TO authenticated, service_role;

-- 3. member_profiles_extended: authenticated-only read
DROP POLICY IF EXISTS "Users can view extended profiles" ON public.member_profiles_extended;
CREATE POLICY "Authenticated can view extended profiles"
  ON public.member_profiles_extended FOR SELECT
  TO authenticated
  USING (true);

-- 4. moment_likes: authenticated-only read
DROP POLICY IF EXISTS "Moment likes are viewable by everyone" ON public.moment_likes;
CREATE POLICY "Authenticated can view moment likes"
  ON public.moment_likes FOR SELECT
  TO authenticated
  USING (true);

-- 5. subscribers: owner or admin
DROP POLICY IF EXISTS "Subscribers are viewable by authenticated users" ON public.subscribers;
CREATE POLICY "Owner can read own subscriber row"
  ON public.subscribers FOR SELECT
  TO authenticated
  USING (auth.email() = email);
CREATE POLICY "Admins can read all subscribers"
  ON public.subscribers FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 6. allowed_domains: enable RLS, admin-only read
ALTER TABLE public.allowed_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can read allowed domains"
  ON public.allowed_domains FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 7. CMS / venue / property / spaces / bedrooms: admin-only writes
-- cms_content
DROP POLICY IF EXISTS "Authenticated users can manage CMS content" ON public.cms_content;
CREATE POLICY "Admins can insert CMS content" ON public.cms_content FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update CMS content" ON public.cms_content FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete CMS content" ON public.cms_content FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- cms_global_content
DROP POLICY IF EXISTS "Authenticated users can manage global content" ON public.cms_global_content;
CREATE POLICY "Admins can insert global content" ON public.cms_global_content FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update global content" ON public.cms_global_content FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete global content" ON public.cms_global_content FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- cms_images
DROP POLICY IF EXISTS "Authenticated users can manage CMS images" ON public.cms_images;
CREATE POLICY "Admins can insert CMS images" ON public.cms_images FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update CMS images" ON public.cms_images FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete CMS images" ON public.cms_images FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- fb_venues
DROP POLICY IF EXISTS "fb_venues writable by auth" ON public.fb_venues;
CREATE POLICY "Admins can insert fb_venues" ON public.fb_venues FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update fb_venues" ON public.fb_venues FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete fb_venues" ON public.fb_venues FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- spaces
DROP POLICY IF EXISTS "spaces writable by auth" ON public.spaces;
CREATE POLICY "Admins can insert spaces" ON public.spaces FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update spaces" ON public.spaces FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete spaces" ON public.spaces FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- properties
DROP POLICY IF EXISTS "properties writable by auth" ON public.properties;
CREATE POLICY "Admins can insert properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update properties" ON public.properties FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete properties" ON public.properties FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- bedrooms
DROP POLICY IF EXISTS "bedrooms writable by auth" ON public.bedrooms;
CREATE POLICY "Admins can insert bedrooms" ON public.bedrooms FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update bedrooms" ON public.bedrooms FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete bedrooms" ON public.bedrooms FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
