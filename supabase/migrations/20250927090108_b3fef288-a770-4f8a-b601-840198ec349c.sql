-- Phase 2: Seed Sample Leads Data

-- Insert sample leads data
INSERT INTO public.leads (
  first_name, last_name, email, phone, event_type, preferred_space, 
  preferred_date, date_flexible, headcount, budget_low, budget_high, 
  message, status, source
) VALUES 
  ('Sarah', 'Johnson', 'sarah.johnson@example.com', '07123 456789', 'Corporate Event', 
   (SELECT id FROM public.spaces WHERE is_active = true LIMIT 1), 
   '2025-02-15', false, 25, 1500, 2500, 
   'Looking for a venue for our quarterly team meeting. Need AV equipment and catering.', 
   'new', 'enquiry_form'),
   
  ('Michael', 'Brown', 'michael.brown@techcorp.com', '07987 654321', 'Product Launch', 
   (SELECT id FROM public.spaces WHERE is_active = true LIMIT 1 OFFSET 1), 
   '2025-03-20', false, 50, 3000, 5000, 
   'Product launch event for new software. Will need presentation setup and networking space.', 
   'qualified', 'website'),
   
  ('Emma', 'Davis', 'emma.davis@events.co.uk', NULL, 'Wedding Reception', 
   (SELECT id FROM public.spaces WHERE is_active = true LIMIT 1), 
   NULL, true, 80, 5000, 8000, 
   'Looking for a beautiful space for a spring wedding reception. Flexible on dates.', 
   'proposed', 'referral'),
   
  ('James', 'Wilson', 'james.wilson@company.com', '07555 123456', 'Meeting/Conference', 
   (SELECT id FROM public.spaces WHERE is_active = true LIMIT 1), 
   '2025-01-30', false, 15, 800, 1200, 
   'Board meeting requiring privacy and professional setting.', 
   'won', 'enquiry_form'),
   
  ('Lucy', 'Taylor', 'lucy.taylor@startup.io', '07444 987654', 'Networking Event', 
   (SELECT id FROM public.spaces WHERE is_active = true LIMIT 1), 
   '2025-04-10', false, 35, 2000, 3000, 
   'Tech networking event. Need space that can accommodate mingling and presentations.', 
   'new', 'social_media'),
   
  ('David', 'Anderson', 'david@creativestudio.com', NULL, 'Workshop/Training', 
   (SELECT id FROM public.spaces WHERE is_active = true LIMIT 1), 
   NULL, true, 20, 1000, 1500, 
   'Creative workshop for design professionals. Flexible timing needed.', 
   'lost', 'enquiry_form');

-- Add sample activities for the leads
INSERT INTO public.lead_activity (lead_id, type, body, author_id, meta) 
SELECT 
  l.id,
  'note',
  CASE 
    WHEN l.status = 'qualified' THEN 'Follow-up call scheduled for next week. Client very interested.'
    WHEN l.status = 'proposed' THEN 'Sent detailed proposal with pricing options.'
    WHEN l.status = 'won' THEN 'Contract signed! Event confirmed for the requested date.'
    WHEN l.status = 'lost' THEN 'Client decided to go with a different venue due to budget constraints.'
    ELSE 'Initial enquiry received. Need to follow up within 24 hours.'
  END,
  NULL,
  jsonb_build_object('event', 'initial_contact')
FROM public.leads l;