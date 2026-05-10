-- 1. Create the allowlist table
CREATE TABLE public.admin_allowlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_by UUID,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Normalise emails to lowercase
CREATE OR REPLACE FUNCTION public.admin_allowlist_lowercase_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email = lower(trim(NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER admin_allowlist_lowercase_email_trigger
BEFORE INSERT OR UPDATE ON public.admin_allowlist
FOR EACH ROW
EXECUTE FUNCTION public.admin_allowlist_lowercase_email();

-- 2. Enable RLS
ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

-- 3. Update is_admin() to check the allowlist instead of allowed_domains
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
    JOIN public.admin_allowlist a
      ON lower(u.email) = a.email
    WHERE u.id = uid
  )
$$;

-- 4. RLS policies on admin_allowlist (admins only)
CREATE POLICY "Admins can read allowlist"
ON public.admin_allowlist
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert allowlist"
ON public.admin_allowlist
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update allowlist"
ON public.admin_allowlist
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete allowlist"
ON public.admin_allowlist
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- 5. Seed the master admin
INSERT INTO public.admin_allowlist (email, notes)
VALUES ('neil.fincham-dukes@crazybear.co.uk', 'Master admin — seeded')
ON CONFLICT (email) DO NOTHING;