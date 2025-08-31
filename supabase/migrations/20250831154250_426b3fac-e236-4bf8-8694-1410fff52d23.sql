-- Create kitchen vendor inquiries table
CREATE TABLE public.kitchen_vendor_inquiries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    business_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    business_type TEXT NOT NULL CHECK (business_type IN ('Street Food', 'Restaurant', 'Bakery', 'Specialty Cuisine', 'Pop-up', 'Other')),
    years_experience INTEGER,
    current_location TEXT,
    cuisine_style TEXT,
    team_size INTEGER,
    daily_covers_target INTEGER,
    previous_food_hall_experience BOOLEAN NOT NULL DEFAULT false,
    social_media_handles TEXT,
    unique_selling_point TEXT,
    questions_comments TEXT,
    submitted_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.kitchen_vendor_inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all vendor inquiries" 
ON public.kitchen_vendor_inquiries 
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Users can insert their own vendor inquiries" 
ON public.kitchen_vendor_inquiries 
FOR INSERT 
WITH CHECK (auth.uid() = submitted_by_user_id);

CREATE POLICY "Users can view their own vendor inquiries" 
ON public.kitchen_vendor_inquiries 
FOR SELECT 
USING (auth.uid() = submitted_by_user_id);