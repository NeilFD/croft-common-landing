-- Update existing events with category 'special' to 'house'
UPDATE public.events 
SET category = 'house' 
WHERE category = 'special';

-- Add a comment to document the valid categories for future reference
COMMENT ON COLUMN public.events.category IS 'Valid categories: gigs, tastings, talks, takeovers, food, house';