-- Create FAQ content table
CREATE TABLE public.cms_faq_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page CHARACTER VARYING NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cms_faq_content ENABLE ROW LEVEL SECURITY;

-- Create policies for FAQ content
CREATE POLICY "CMS FAQ content - allowed domain users can view all"
ON public.cms_faq_content
FOR SELECT
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "Public can view published FAQ content"
ON public.cms_faq_content
FOR SELECT
USING (published = true);

CREATE POLICY "CMS FAQ content - allowed domain users can insert"
ON public.cms_faq_content
FOR INSERT
WITH CHECK (is_email_domain_allowed(get_user_email()) AND auth.uid() = created_by);

CREATE POLICY "CMS FAQ content - allowed domain users can update"
ON public.cms_faq_content
FOR UPDATE
USING (is_email_domain_allowed(get_user_email()));

CREATE POLICY "CMS FAQ content - allowed domain users can delete"
ON public.cms_faq_content
FOR DELETE
USING (is_email_domain_allowed(get_user_email()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cms_faq_content_updated_at
BEFORE UPDATE ON public.cms_faq_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial FAQ data for existing pages
INSERT INTO public.cms_faq_content (page, question, answer, sort_order, published) VALUES
-- Home page FAQs
('home', 'What is Croft Common?', 'Croft Common is a vibrant community space offering exceptional food, craft beer, cocktails, and memorable events. We''re a place where neighbors become friends and experiences become memories.', 1, true),
('home', 'What type of food do you serve?', 'We serve a diverse menu featuring British and international cuisine, made with fresh, locally-sourced ingredients. Our kitchen offers everything from light cafe bites to hearty pub meals.', 2, true),
('home', 'Do you host private events?', 'Yes! Our versatile spaces are perfect for private dining, celebrations, meetings, and community gatherings. Contact us to discuss your event needs.', 3, true),
('home', 'What are your opening hours?', 'We''re open Monday through Sunday, 9:00 AM to 11:00 PM. Please check our calendar for special events and holiday hours.', 4, true),
('home', 'Do you accept reservations?', 'Yes, we accept reservations for dining. You can book a table through our website or by calling us directly.', 5, true),

-- Beer page FAQs
('beer', 'What types of beer do you serve?', 'We offer a carefully curated selection of craft beers and traditional ales, including local brews, seasonal specials, and classic favorites served fresh from our steel lines.', 1, true),
('beer', 'Do you have beer tasting events?', 'Yes! We regularly host beer tasting events and brewery nights. Check our calendar for upcoming events and special beer releases.', 2, true),
('beer', 'Can I book a table for just drinks?', 'Absolutely! Our long tables and comfortable seating are perfect for drinks with friends. No food order required - just good company and cold pints.', 3, true),
('beer', 'Do you serve food with your beer?', 'Yes, our kitchen serves perfectly paired pub food that complements our beer selection. From hearty meals to light snacks, we have something for every appetite.', 4, true);