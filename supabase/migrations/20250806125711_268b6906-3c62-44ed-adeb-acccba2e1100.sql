-- First, update all existing 'special' categories to 'house'
UPDATE public.events 
SET category = 'house' 
WHERE category = 'special';

-- Drop the existing check constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_category_check;

-- Add a new check constraint that includes the correct categories
ALTER TABLE public.events ADD CONSTRAINT events_category_check 
CHECK (category IN ('gigs', 'tastings', 'talks', 'takeovers', 'food', 'house'));

-- Add a comment to document the valid categories
COMMENT ON COLUMN public.events.category IS 'Valid categories: gigs, tastings, talks, takeovers, food, house';