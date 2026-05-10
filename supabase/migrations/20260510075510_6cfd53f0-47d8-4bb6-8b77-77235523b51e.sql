CREATE OR REPLACE FUNCTION public.get_user_management_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.user_id = _user_id
    AND lower(u.email) LIKE '%@crazybear.co.uk'
  ORDER BY CASE ur.role
    WHEN 'admin' THEN 1
    WHEN 'sales' THEN 2
    WHEN 'ops' THEN 3
    WHEN 'finance' THEN 4
    WHEN 'readonly' THEN 5
    ELSE 99
  END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_management_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN auth.users u ON u.id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND lower(u.email) LIKE '%@crazybear.co.uk'
  );
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = 'neil.fincham-dukes@crazybear.co.uk'
ON CONFLICT (user_id, role) DO NOTHING;