-- Create moment_likes table
CREATE TABLE public.moment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moment_id UUID NOT NULL REFERENCES public.member_moments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(moment_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.moment_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for moment_likes
CREATE POLICY "Users can like moments" 
ON public.moment_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" 
ON public.moment_likes 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view likes for approved visible moments" 
ON public.moment_likes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.member_moments mm 
    WHERE mm.id = moment_likes.moment_id 
    AND mm.moderation_status = 'approved' 
    AND mm.is_visible = true
  )
);

-- Create indexes for better performance
CREATE INDEX idx_moment_likes_moment_id ON public.moment_likes(moment_id);
CREATE INDEX idx_moment_likes_user_id ON public.moment_likes(user_id);