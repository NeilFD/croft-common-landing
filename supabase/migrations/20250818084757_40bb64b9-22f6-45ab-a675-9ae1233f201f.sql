-- Create pong_scores table for high score tracking
CREATE TABLE public.pong_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  game_duration INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pong_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for pong scores
CREATE POLICY "Anyone can view pong scores" 
ON public.pong_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert their own scores" 
ON public.pong_scores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for faster high score queries
CREATE INDEX idx_pong_scores_score_desc ON public.pong_scores (score DESC, created_at DESC);