-- Create member_moments table for photo uploads
CREATE TABLE public.member_moments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  tagline TEXT NOT NULL,
  date_taken DATE NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Location data (optional)
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  location_confirmed BOOLEAN NOT NULL DEFAULT false,
  
  -- Moderation fields
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'needs_review')),
  moderation_reason TEXT NULL,
  moderated_at TIMESTAMP WITH TIME ZONE NULL,
  moderated_by UUID NULL,
  
  -- AI moderation metadata
  ai_confidence_score DECIMAL(3, 2) NULL,
  ai_flags JSONB NULL DEFAULT '[]'::jsonb,
  
  -- Display settings
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_visible BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.member_moments ENABLE ROW LEVEL SECURITY;

-- Users can insert their own moments
CREATE POLICY "Users can insert their own moments" 
ON public.member_moments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can view approved and visible moments
CREATE POLICY "Users can view approved moments" 
ON public.member_moments 
FOR SELECT 
USING (moderation_status = 'approved' AND is_visible = true);

-- Users can view their own moments regardless of status
CREATE POLICY "Users can view their own moments" 
ON public.member_moments 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can update their own pending moments
CREATE POLICY "Users can update their own pending moments" 
ON public.member_moments 
FOR UPDATE 
USING (auth.uid() = user_id AND moderation_status = 'pending');

-- Users can delete their own moments
CREATE POLICY "Users can delete their own moments" 
ON public.member_moments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allowed domain users (admins) can view all moments
CREATE POLICY "Admins can view all moments" 
ON public.member_moments 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

-- Admins can update moderation status
CREATE POLICY "Admins can update moderation status" 
ON public.member_moments 
FOR UPDATE 
USING (is_email_domain_allowed(get_user_email()));

-- Create storage bucket for moments
INSERT INTO storage.buckets (id, name, public) VALUES ('moments', 'moments', true);

-- Create storage policies for moments bucket
CREATE POLICY "Users can upload their own moment photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'moments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view approved moment photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'moments');

CREATE POLICY "Users can update their own moment photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'moments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own moment photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'moments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can manage all moment photos
CREATE POLICY "Admins can manage all moment photos" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'moments' AND EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = auth.uid() 
  AND is_email_domain_allowed(auth.users.email)
));

-- Add trigger for updating timestamp
CREATE TRIGGER update_member_moments_updated_at
  BEFORE UPDATE ON public.member_moments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if coordinates are within Croft Common area
CREATE OR REPLACE FUNCTION public.is_within_venue_bounds(lat DECIMAL, lng DECIMAL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  venue_lat DECIMAL := 51.4583;
  venue_lng DECIMAL := -2.6014;
  max_distance_km DECIMAL := 0.2; -- 200 meter radius
  distance_km DECIMAL;
BEGIN
  -- Calculate approximate distance using Haversine formula (simplified)
  distance_km := SQRT(
    POWER(69.1 * (lat - venue_lat), 2) + 
    POWER(69.1 * (lng - venue_lng) * COS(venue_lat / 57.3), 2)
  ) * 1.609344; -- Convert miles to km
  
  RETURN distance_km <= max_distance_km;
END;
$$;