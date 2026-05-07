
-- Reset streaks and check-ins
DELETE FROM public.member_check_ins;
UPDATE public.member_streaks SET current_streak=0, longest_streak=0, total_check_ins=0, last_check_in_date=NULL;

-- Seed CB Home Delivery menu (Thai). Wipe old.
DELETE FROM public.lunch_menu;
INSERT INTO public.lunch_menu (name, description, price, category, sort_order, is_available) VALUES
('Pad Thai Prawn', 'Wok-fried rice noodles, prawns, tamarind, peanuts, lime.', 12.50, 'main', 1, true),
('Green Curry Chicken', 'Aromatic green curry, jasmine rice, Thai basil.', 13.00, 'main', 2, true),
('Massaman Beef', 'Slow-cooked beef, potatoes, peanuts, jasmine rice.', 14.50, 'main', 3, true),
('Tofu Pad See Ew', 'Wide rice noodles, dark soy, Chinese broccoli, crispy tofu.', 11.50, 'main', 4, true),
('Tom Yum Soup', 'Hot and sour broth, prawns, lemongrass, mushrooms.', 9.50, 'main', 5, true),
('Crispy Spring Rolls', 'Vegetable spring rolls, sweet chilli dip.', 6.00, 'starter', 6, true),
('Chicken Satay', 'Grilled skewers, peanut sauce, cucumber relish.', 7.50, 'starter', 7, true),
('Mango Sticky Rice', 'Sweet sticky rice, fresh mango, coconut cream.', 6.50, 'dessert', 8, true),
('Singha Beer', 'Thai lager, 330ml.', 4.50, 'beverage', 9, true),
('Thai Iced Tea', 'Sweet, creamy, spiced.', 3.50, 'beverage', 10, true),
('Coconut Water', 'Chilled, fresh.', 3.00, 'beverage', 11, true);
