-- Fix search_path for security definer functions
CREATE OR REPLACE FUNCTION public.has_management_role(_user_id uuid, _role management_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_management_role(_user_id uuid)
RETURNS management_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'sales' THEN 2
    WHEN 'ops' THEN 3
    WHEN 'finance' THEN 4
    WHEN 'readonly' THEN 5
  END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.log_audit_entry(_action text, _entity text, _entity_id uuid, _diff jsonb DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.audit_log (actor_id, action, entity, entity_id, diff)
  VALUES (auth.uid(), _action, _entity, _entity_id, _diff)
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = 'public';

-- Assign admin role to neil@cityandsanctuary.com if user exists
DO $$
DECLARE
  neil_user_id uuid;
BEGIN
  -- Get Neil's user ID from auth.users if it exists
  SELECT id INTO neil_user_id 
  FROM auth.users 
  WHERE email = 'neil@cityandsanctuary.com';
  
  -- Only insert if user exists
  IF neil_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (neil_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;