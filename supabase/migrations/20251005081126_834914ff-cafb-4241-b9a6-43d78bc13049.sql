-- Phase 1: Expand spaces table with detailed characteristics
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS ambience text;
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS natural_light text;
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS outdoor_access boolean DEFAULT false;
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS av_capabilities jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS layout_flexibility text;
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS catering_style text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS accessibility_features text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS unique_features text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS ideal_event_types text[] DEFAULT ARRAY[]::text[];
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS pricing_tier text;
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS min_guests integer;
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS max_guests integer;

COMMENT ON COLUMN public.spaces.ambience IS 'e.g., "Intimate and cosy", "Industrial and edgy", "Bright and airy"';
COMMENT ON COLUMN public.spaces.natural_light IS 'e.g., "Abundant", "Moderate", "Limited", "None"';
COMMENT ON COLUMN public.spaces.outdoor_access IS 'Direct outdoor space access';
COMMENT ON COLUMN public.spaces.av_capabilities IS 'JSON: {sound_system, projector, screens, lighting_options, microphones}';
COMMENT ON COLUMN public.spaces.layout_flexibility IS '"High", "Moderate", "Fixed"';
COMMENT ON COLUMN public.spaces.catering_style IS 'Array: ["Standing buffet", "Seated dinner", "Cocktail reception"]';
COMMENT ON COLUMN public.spaces.ideal_event_types IS 'Array: ["Corporate dinner", "Wedding reception", "Birthday party"]';
COMMENT ON COLUMN public.spaces.pricing_tier IS '"Standard", "Premium", "Luxury"';

-- Phase 2: Create event_enquiries table
CREATE TABLE IF NOT EXISTS public.event_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  
  -- Contact Info
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  
  -- Event Details
  event_type text,
  event_date date,
  event_time text,
  guest_count integer,
  
  -- Conversation Data
  conversation_history jsonb DEFAULT '[]'::jsonb,
  key_requirements jsonb DEFAULT '{}'::jsonb,
  
  -- AI Recommendations
  recommended_space_id uuid REFERENCES public.spaces(id),
  ai_reasoning text,
  
  -- Food & Beverage
  fb_style text,
  fb_preferences text,
  fb_dos_donts text,
  
  -- Budget
  budget_range text,
  budget_flexibility text,
  
  -- Additional Info
  additional_comments text,
  special_requirements text,
  
  -- Status
  status text DEFAULT 'new',
  
  -- Metadata
  submitted_at timestamptz,
  converted_to_lead_id uuid REFERENCES public.leads(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_enquiries ENABLE ROW LEVEL SECURITY;

-- Policies for event_enquiries
CREATE POLICY "Management can view all enquiries"
  ON public.event_enquiries
  FOR SELECT
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role) OR
    has_management_role(auth.uid(), 'finance'::management_role) OR
    has_management_role(auth.uid(), 'readonly'::management_role)
  );

CREATE POLICY "System can insert enquiries"
  ON public.event_enquiries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Management can update enquiries"
  ON public.event_enquiries
  FOR UPDATE
  USING (
    has_management_role(auth.uid(), 'admin'::management_role) OR
    has_management_role(auth.uid(), 'sales'::management_role) OR
    has_management_role(auth.uid(), 'ops'::management_role)
  );

-- Add updated_at trigger
CREATE TRIGGER update_event_enquiries_updated_at
  BEFORE UPDATE ON public.event_enquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_event_enquiries_status ON public.event_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_event_enquiries_created_at ON public.event_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_enquiries_recommended_space ON public.event_enquiries(recommended_space_id);