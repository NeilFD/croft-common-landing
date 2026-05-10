
-- 1. Allow any email domain in role helpers (access still requires an explicit user_roles row)
CREATE OR REPLACE FUNCTION public.get_user_management_role(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  ORDER BY CASE ur.role
    WHEN 'admin' THEN 1
    WHEN 'sales' THEN 2
    WHEN 'ops' THEN 3
    WHEN 'finance' THEN 4
    WHEN 'readonly' THEN 5
    ELSE 99
  END
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.has_management_role(_user_id uuid, _role text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
  );
$function$;

-- 2. RPC the User Management page calls
CREATE OR REPLACE FUNCTION public.get_management_users()
 RETURNS TABLE(
   user_id uuid,
   user_name text,
   email text,
   job_title text,
   role text,
   created_at timestamptz
 )
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only admins (or the calling user themselves) should see the list
  IF NOT public.has_management_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can list management users';
  END IF;

  RETURN QUERY
  SELECT
    u.id            AS user_id,
    COALESCE(mp.display_name, u.email) AS user_name,
    u.email::text   AS email,
    mp.job_title,
    ur.role::text   AS role,
    u.created_at
  FROM auth.users u
  JOIN public.user_roles ur ON ur.user_id = u.id
  LEFT JOIN public.management_profiles mp ON mp.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_management_users() TO authenticated;
