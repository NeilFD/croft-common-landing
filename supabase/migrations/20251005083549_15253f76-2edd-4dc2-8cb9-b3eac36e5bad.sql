-- Add detailed characteristic fields to spaces table
ALTER TABLE public.spaces 
ADD COLUMN IF NOT EXISTS min_guests integer,
ADD COLUMN IF NOT EXISTS max_guests integer,
ADD COLUMN IF NOT EXISTS ambience text,
ADD COLUMN IF NOT EXISTS natural_light text,
ADD COLUMN IF NOT EXISTS outdoor_access boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS av_capabilities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS layout_flexibility text,
ADD COLUMN IF NOT EXISTS catering_style text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ideal_event_types text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS unique_features text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS accessibility_features text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pricing_tier text;

-- Add check constraints for logical capacity values
ALTER TABLE public.spaces 
ADD CONSTRAINT check_min_max_guests CHECK (min_guests IS NULL OR max_guests IS NULL OR min_guests <= max_guests);

COMMENT ON COLUMN public.spaces.min_guests IS 'Minimum number of guests for this space';
COMMENT ON COLUMN public.spaces.max_guests IS 'Maximum number of guests for this space';
COMMENT ON COLUMN public.spaces.ambience IS 'Overall ambience/atmosphere description';
COMMENT ON COLUMN public.spaces.natural_light IS 'Natural light availability: excellent, good, moderate, limited, none';
COMMENT ON COLUMN public.spaces.outdoor_access IS 'Whether space has outdoor access';
COMMENT ON COLUMN public.spaces.av_capabilities IS 'Array of AV capabilities available';
COMMENT ON COLUMN public.spaces.layout_flexibility IS 'How flexible the layout is: highly_flexible, moderately_flexible, fixed';
COMMENT ON COLUMN public.spaces.catering_style IS 'Array of supported catering styles';
COMMENT ON COLUMN public.spaces.ideal_event_types IS 'Array of ideal event types for this space';
COMMENT ON COLUMN public.spaces.unique_features IS 'Array of unique features of the space';
COMMENT ON COLUMN public.spaces.accessibility_features IS 'Array of accessibility features available';
COMMENT ON COLUMN public.spaces.pricing_tier IS 'Pricing tier: budget, mid_range, premium, luxury';