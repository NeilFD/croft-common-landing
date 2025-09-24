-- Create feedback_submissions table with individual rating columns
CREATE TABLE public.feedback_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  source_page TEXT DEFAULT 'unknown',
  
  -- Individual rating columns (1-5 scale, nullable for optional ratings)
  hospitality_rating INTEGER CHECK (hospitality_rating >= 1 AND hospitality_rating <= 5),
  food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
  drink_rating INTEGER CHECK (drink_rating >= 1 AND drink_rating <= 5),
  team_rating INTEGER CHECK (team_rating >= 1 AND team_rating <= 5),
  venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
  price_rating INTEGER CHECK (price_rating >= 1 AND price_rating <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public to insert feedback (for anonymous submissions)
CREATE POLICY "Anyone can submit feedback" 
ON public.feedback_submissions 
FOR INSERT 
WITH CHECK (true);

-- Allow admins to view all feedback
CREATE POLICY "Admins can view all feedback" 
ON public.feedback_submissions 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

-- Allow users to view their own feedback if authenticated
CREATE POLICY "Users can view their own feedback" 
ON public.feedback_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_feedback_submissions_updated_at
BEFORE UPDATE ON public.feedback_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_feedback_submissions_created_at ON public.feedback_submissions(created_at DESC);
CREATE INDEX idx_feedback_submissions_user_id ON public.feedback_submissions(user_id);
CREATE INDEX idx_feedback_submissions_source_page ON public.feedback_submissions(source_page);