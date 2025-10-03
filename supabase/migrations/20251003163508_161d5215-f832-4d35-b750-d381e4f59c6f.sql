-- Add 'manager' role to management_role enum
ALTER TYPE management_role ADD VALUE IF NOT EXISTS 'manager';

-- Create user_password_metadata table
CREATE TABLE IF NOT EXISTS public.user_password_metadata (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  must_change_password boolean NOT NULL DEFAULT true,
  password_changed_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  is_first_login boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_password_metadata ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_password_metadata
CREATE POLICY "Users can view their own password metadata"
  ON public.user_password_metadata
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage password metadata"
  ON public.user_password_metadata
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create management_user_audit table
CREATE TABLE IF NOT EXISTS public.management_user_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.management_user_audit ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit logs (admin only)
CREATE POLICY "Admins can view audit logs"
  ON public.management_user_audit
  FOR SELECT
  USING (has_management_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit logs"
  ON public.management_user_audit
  FOR INSERT
  WITH CHECK (true);

-- Function to generate random password (8 characters)
CREATE OR REPLACE FUNCTION public.generate_temp_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Function to create management user (admin only)
CREATE OR REPLACE FUNCTION public.create_management_user(
  p_email text,
  p_role management_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  temp_password text;
  result jsonb;
BEGIN
  -- Check if caller is admin
  IF NOT has_management_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can create management users';
  END IF;

  -- Validate email
  IF p_email IS NULL OR LENGTH(TRIM(p_email)) = 0 THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Role must be either admin or manager';
  END IF;

  -- Generate temporary password
  temp_password := generate_temp_password();

  -- Create user in auth.users (using admin API would be better, but this is a workaround)
  -- Note: This requires the edge function to actually create the auth user
  -- For now, we'll return the data needed for the edge function
  
  RETURN jsonb_build_object(
    'email', p_email,
    'role', p_role,
    'temp_password', temp_password,
    'created_by', auth.uid()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_management_user(text, management_role) TO authenticated;

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION public.update_management_user_role(
  p_user_id uuid,
  p_new_role management_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT has_management_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Cannot change own role
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  -- Validate new role
  IF p_new_role NOT IN ('admin', 'manager') THEN
    RAISE EXCEPTION 'Role must be either admin or manager';
  END IF;

  -- Update role
  UPDATE public.user_roles
  SET role = p_new_role
  WHERE user_id = p_user_id;

  -- Log audit
  INSERT INTO public.management_user_audit (action, target_user_id, actor_id, details)
  VALUES ('role_change', p_user_id, auth.uid(), jsonb_build_object('new_role', p_new_role));
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_management_user_role(uuid, management_role) TO authenticated;

-- Function to deactivate management user (admin only)
CREATE OR REPLACE FUNCTION public.deactivate_management_user(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT has_management_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can deactivate users';
  END IF;

  -- Cannot deactivate self
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot deactivate your own account';
  END IF;

  -- Check if at least one other admin will remain
  IF (SELECT role FROM public.user_roles WHERE user_id = p_user_id) = 'admin' THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin' AND user_id != p_user_id) = 0 THEN
      RAISE EXCEPTION 'Cannot deactivate the last admin';
    END IF;
  END IF;

  -- Remove from user_roles (soft delete)
  DELETE FROM public.user_roles WHERE user_id = p_user_id;

  -- Log audit
  INSERT INTO public.management_user_audit (action, target_user_id, actor_id)
  VALUES ('user_deactivated', p_user_id, auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.deactivate_management_user(uuid) TO authenticated;

-- Function to force password change (admin only)
CREATE OR REPLACE FUNCTION public.force_password_change(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT has_management_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can force password changes';
  END IF;

  -- Update password metadata
  INSERT INTO public.user_password_metadata (user_id, must_change_password)
  VALUES (p_user_id, true)
  ON CONFLICT (user_id) 
  DO UPDATE SET must_change_password = true, updated_at = now();

  -- Log audit
  INSERT INTO public.management_user_audit (action, target_user_id, actor_id)
  VALUES ('force_password_change', p_user_id, auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.force_password_change(uuid) TO authenticated;

-- Function to check if password change is required
CREATE OR REPLACE FUNCTION public.check_password_change_required()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  must_change boolean;
BEGIN
  SELECT COALESCE(upm.must_change_password, false)
  INTO must_change
  FROM public.user_password_metadata upm
  WHERE upm.user_id = auth.uid();

  RETURN COALESCE(must_change, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_password_change_required() TO authenticated;

-- Function to mark password as changed
CREATE OR REPLACE FUNCTION public.mark_password_changed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_password_metadata (
    user_id, 
    must_change_password, 
    password_changed_at,
    is_first_login
  )
  VALUES (
    auth.uid(), 
    false, 
    now(),
    false
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    must_change_password = false,
    password_changed_at = now(),
    is_first_login = false,
    updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_password_changed() TO authenticated;