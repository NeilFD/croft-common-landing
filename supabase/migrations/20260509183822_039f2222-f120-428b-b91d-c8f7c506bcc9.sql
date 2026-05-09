
-- Allow members (any authenticated user) to read available menu items
DROP POLICY IF EXISTS "Authenticated can read available menu" ON public.lunch_menu;
CREATE POLICY "Authenticated can read available menu"
ON public.lunch_menu
FOR SELECT
TO authenticated
USING (is_available = true);

-- Reset menu and rebuild with proper Thai categories
DELETE FROM public.lunch_menu;

INSERT INTO public.lunch_menu (name, description, price, category, site, is_available, sort_order) VALUES
-- SMALL PLATES
('Crispy Spring Rolls', 'Vegetable, glass noodle, sweet chilli', 6.00, 'small_plate', 'both', true, 1),
('Chicken Satay', 'Charcoal grilled, peanut, cucumber relish', 7.50, 'small_plate', 'both', true, 2),
('Tom Yum Soup', 'Hot and sour, lemongrass, prawn', 9.50, 'small_plate', 'both', true, 3),
('Tom Kha Gai', 'Coconut and galangal chicken soup', 9.00, 'small_plate', 'both', true, 4),
('Som Tam', 'Green papaya salad, peanut, lime, chilli', 8.00, 'small_plate', 'both', true, 5),
('Money Bags', 'Crispy parcels of pork and water chestnut', 7.00, 'small_plate', 'town', true, 6),
('Salt and Pepper Squid', 'Crisp fried, chilli, spring onion', 8.50, 'small_plate', 'country', true, 7),
('Prawn Toasts', 'Sesame, sweet chilli', 7.50, 'small_plate', 'both', true, 8),
('Tamarind Chicken Wings', 'Sticky, sour, hot', 7.50, 'small_plate', 'both', true, 9),

-- LARGE PLATES
('Pad Thai Prawn', 'Wok fried rice noodle, tamarind, peanut', 13.50, 'large_plate', 'both', true, 1),
('Tofu Pad See Ew', 'Wide noodle, dark soy, gai lan', 11.50, 'large_plate', 'both', true, 2),
('Pad Krapow Pork', 'Holy basil mince, chilli, fried egg', 12.50, 'large_plate', 'both', true, 3),
('Crispy Sea Bass', 'Whole fried, three flavour sauce', 22.00, 'large_plate', 'country', true, 4),
('Beef Salad', 'Grilled rump, lime, chilli, mint', 14.50, 'large_plate', 'town', true, 5),
('Duck Pad Cha', 'Wild ginger, green peppercorn, holy basil', 16.50, 'large_plate', 'country', true, 6),

-- CURRIES
('Green Curry Chicken', 'Coconut, Thai basil, aubergine', 13.00, 'curry', 'both', true, 1),
('Massaman Beef', 'Slow cooked, peanut, potato', 14.50, 'curry', 'both', true, 2),
('Red Curry Duck', 'Lychee, pineapple, cherry tomato', 15.50, 'curry', 'both', true, 3),
('Penang Curry Chicken', 'Rich, mild, kaffir lime', 13.00, 'curry', 'both', true, 4),
('Yellow Curry Prawn', 'Turmeric, coconut, sweet onion', 14.50, 'curry', 'town', true, 5),
('Jungle Curry Pork', 'Fierce, herbal, no coconut', 13.50, 'curry', 'country', true, 6),

-- SIDES
('Jasmine Rice', 'Steamed', 3.00, 'side', 'both', true, 1),
('Sticky Rice', 'Steamed in bamboo', 3.50, 'side', 'both', true, 2),
('Egg Fried Rice', 'Spring onion, soy', 4.00, 'side', 'both', true, 3),
('Morning Glory', 'Stir fried, garlic, chilli, oyster sauce', 6.50, 'side', 'both', true, 4),
('Roti', 'Flaky, golden', 3.50, 'side', 'both', true, 5),
('Asian Slaw', 'Crunchy, sesame, lime', 4.50, 'side', 'both', true, 6),

-- PUDDINGS
('Mango Sticky Rice', 'Coconut cream, toasted sesame', 6.50, 'dessert', 'both', true, 1),
('Coconut Pannacotta', 'Palm sugar, lime', 6.50, 'dessert', 'both', true, 2),
('Banana Fritters', 'Condensed milk, sesame', 6.00, 'dessert', 'both', true, 3),
('Black Rice Pudding', 'Coconut cream, mango', 6.50, 'dessert', 'country', true, 4),
('Lychee Sorbet', 'Clean, cold, fragrant', 5.00, 'dessert', 'both', true, 5);
