-- Create user roles enum
CREATE TYPE public.management_role AS ENUM ('admin', 'sales', 'ops', 'finance', 'readonly');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role management_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (user_id, role)
);

-- Create spaces table
CREATE TABLE public.spaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    capacity_seated integer DEFAULT 0 CHECK (capacity_seated >= 0),
    capacity_standing integer DEFAULT 0 CHECK (capacity_standing >= 0),
    is_active boolean DEFAULT true NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create space_hours table
CREATE TABLE public.space_hours (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id uuid REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
    day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL,
    open_time time without time zone,
    close_time time without time zone,
    late_close_allowed boolean DEFAULT false,
    buffer_before_min integer DEFAULT 0 CHECK (buffer_before_min >= 0),
    buffer_after_min integer DEFAULT 0 CHECK (buffer_after_min >= 0),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE (space_id, day_of_week)
);

-- Create audit_log table
CREATE TABLE public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id uuid,
    diff jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_management_role(_user_id uuid, _role management_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Create function to get user's highest management role
CREATE OR REPLACE FUNCTION public.get_user_management_role(_user_id uuid)
RETURNS management_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_entry(_action text, _entity text, _entity_id uuid, _diff jsonb DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_management_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_management_role(auth.uid(), 'admin'));

-- RLS Policies for spaces
CREATE POLICY "Admin full access to spaces" ON public.spaces
  FOR ALL USING (public.has_management_role(auth.uid(), 'admin'));

CREATE POLICY "Sales can edit basic space details" ON public.spaces
  FOR UPDATE USING (public.has_management_role(auth.uid(), 'sales'))
  WITH CHECK (public.has_management_role(auth.uid(), 'sales'));

CREATE POLICY "Sales can view spaces" ON public.spaces
  FOR SELECT USING (public.has_management_role(auth.uid(), 'sales'));

CREATE POLICY "Staff can view spaces" ON public.spaces
  FOR SELECT USING (
    public.has_management_role(auth.uid(), 'ops') OR
    public.has_management_role(auth.uid(), 'finance') OR
    public.has_management_role(auth.uid(), 'readonly')
  );

-- RLS Policies for space_hours
CREATE POLICY "Admin full access to space hours" ON public.space_hours
  FOR ALL USING (public.has_management_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view space hours" ON public.space_hours
  FOR SELECT USING (
    public.has_management_role(auth.uid(), 'sales') OR
    public.has_management_role(auth.uid(), 'ops') OR
    public.has_management_role(auth.uid(), 'finance') OR
    public.has_management_role(auth.uid(), 'readonly')
  );

-- RLS Policies for audit_log
CREATE POLICY "All writes via RPC only" ON public.audit_log
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Admin and finance can view all audit logs" ON public.audit_log
  FOR SELECT USING (
    public.has_management_role(auth.uid(), 'admin') OR
    public.has_management_role(auth.uid(), 'finance')
  );

CREATE POLICY "Users can view their own audit logs" ON public.audit_log
  FOR SELECT USING (auth.uid() = actor_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_spaces_updated_at
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_space_hours_updated_at
  BEFORE UPDATE ON public.space_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data
-- First, assign admin role to neil@cityandsanctuary.com
DO $$
DECLARE
  neil_user_id uuid;
BEGIN
  -- Get Neil's user ID
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

-- Insert default spaces
INSERT INTO public.spaces (name, slug, description, capacity_seated, capacity_standing, display_order) VALUES
  ('Hall', 'hall', 'Main event hall space', 120, 200, 1),
  ('Rooftop', 'rooftop', 'Open-air rooftop area', 60, 100, 2),
  ('Hall Terrace', 'hall-terrace', 'Outdoor terrace adjacent to hall', 40, 80, 3),
  ('Courtyard', 'courtyard', 'Central courtyard space', 30, 60, 4),
  ('Roastery & Café', 'roastery-cafe', 'Coffee roastery and café area', 25, 40, 5),
  ('Taproom', 'taproom', 'Bar and taproom area', 35, 70, 6);

-- Insert default trading hours for all spaces (Monday-Sunday, 0-6)
INSERT INTO public.space_hours (space_id, day_of_week, open_time, close_time, late_close_allowed, buffer_before_min, buffer_after_min)
SELECT 
  s.id,
  d.day_of_week,
  '09:00'::time,
  '23:00'::time,
  true,
  30,
  60
FROM public.spaces s
CROSS JOIN (
  SELECT generate_series(0, 6) as day_of_week
) d;