-- Add tags column to member_moments table
ALTER TABLE public.member_moments ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for better tag filtering performance
CREATE INDEX idx_member_moments_tags ON public.member_moments USING GIN(tags);

-- Add comment for documentation
COMMENT ON COLUMN public.member_moments.tags IS 'Array of searchable tags for moments, can include preset and custom tags';