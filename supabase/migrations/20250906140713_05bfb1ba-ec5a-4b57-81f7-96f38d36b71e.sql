-- Add some test member data to see if the analytics is working
INSERT INTO public.profiles (user_id, first_name, last_name, birthday, interests) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'John', 'Doe', '1990-01-01', ARRAY['music', 'coffee']),
('123e4567-e89b-12d3-a456-426614174001', 'Jane', 'Smith', '1985-06-15', ARRAY['art', 'drinks']),
('123e4567-e89b-12d3-a456-426614174002', 'Bob', 'Johnson', '1992-03-20', ARRAY['food', 'events'])
ON CONFLICT (user_id) DO NOTHING;

-- Add some extended profiles
INSERT INTO public.member_profiles_extended (user_id, display_name, tier_badge, join_date) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'Johnny D', 'gold', '2024-01-15'),
('123e4567-e89b-12d3-a456-426614174001', 'Jane S', 'silver', '2024-02-20'),
('123e4567-e89b-12d3-a456-426614174002', 'Bob J', 'bronze', '2024-03-10')
ON CONFLICT (user_id) DO NOTHING;

-- Add some transaction data
INSERT INTO public.member_ledger (user_id, activity_type, activity_date, amount, currency, description, category, payment_method) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'receipt', '2024-11-01', 15.50, 'GBP', 'Coffee and pastry', 'food', 'card'),
('123e4567-e89b-12d3-a456-426614174000', 'receipt', '2024-11-15', 25.00, 'GBP', 'Lunch meal', 'food', 'card'),
('123e4567-e89b-12d3-a456-426614174001', 'receipt', '2024-10-20', 45.00, 'GBP', 'Evening drinks', 'drinks', 'cash'),
('123e4567-e89b-12d3-a456-426614174001', 'receipt', '2024-11-05', 30.00, 'GBP', 'Dinner', 'food', 'card'),
('123e4567-e89b-12d3-a456-426614174002', 'receipt', '2024-09-10', 12.00, 'GBP', 'Coffee', 'drinks', 'card')
ON CONFLICT (id) DO NOTHING;

-- Add some check-ins
INSERT INTO public.member_check_ins (user_id, entrance_slug, check_in_date, check_in_timestamp) VALUES
('123e4567-e89b-12d3-a456-426614174000', 'main-entrance', '2024-11-01', '2024-11-01 10:30:00'),
('123e4567-e89b-12d3-a456-426614174000', 'main-entrance', '2024-11-15', '2024-11-15 14:00:00'),
('123e4567-e89b-12d3-a456-426614174001', 'side-entrance', '2024-10-20', '2024-10-20 18:00:00'),
('123e4567-e89b-12d3-a456-426614174001', 'main-entrance', '2024-11-05', '2024-11-05 19:30:00'),
('123e4567-e89b-12d3-a456-426614174002', 'main-entrance', '2024-09-10', '2024-09-10 09:00:00')
ON CONFLICT (id) DO NOTHING;