-- Clear all existing content for kitchens-hideout page
DELETE FROM public.cms_menu_items WHERE section_id IN (
  SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout'
);
DELETE FROM public.cms_menu_sections WHERE page = 'kitchens-hideout';
DELETE FROM public.cms_content WHERE page = 'kitchens-hideout';

-- Add page title and subtitle for Hideout
INSERT INTO public.cms_content (page, section, content_key, content_data, content_type, published) VALUES
('kitchens-hideout', 'hero', 'title', '"The Hideout"', 'text', true),
('kitchens-hideout', 'hero', 'description', '"Private. Elevated. Off the radar."', 'text', true);

-- Insert menu sections for Hideout
INSERT INTO public.cms_menu_sections (page, section_name, sort_order, published) VALUES
('kitchens-hideout', 'HOW IT WORKS', 1, true),
('kitchens-hideout', 'BITES & SMALL PLATES', 2, true),
('kitchens-hideout', 'PIZZAS', 3, true),
('kitchens-hideout', 'MAINS', 4, true),
('kitchens-hideout', 'SIDES', 5, true),
('kitchens-hideout', 'DESSERTS', 6, true),
('kitchens-hideout', 'PRE-BUILT (PER HEAD)', 7, true);

-- Insert HOW IT WORKS items (special instructions)
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'HOW IT WORKS'), 'For groups of 10+ only', '', '', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'HOW IT WORKS'), 'Pre-order in advance', '', '', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'HOW IT WORKS'), 'Takeaway style. Roof terrace vibes', '', '', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'HOW IT WORKS'), 'Order individual dishes, or go easy with a full per-head pack', '', '', 4, true);

-- Insert BITES & SMALL PLATES items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'BITES & SMALL PLATES'), 'Padron Peppers, Sea Salt', '', '£6', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'BITES & SMALL PLATES'), 'Jamón Croquetas', '', '£9', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'BITES & SMALL PLATES'), 'Sticky Pork Belly, Burnt Pineapple', '', '£9', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'BITES & SMALL PLATES'), 'Karaage Fried Chicken, Yuzu Mayo', '', '£9', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'BITES & SMALL PLATES'), 'Crispy Squid, Lemon, Seaweed Salt', '', '£11', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'BITES & SMALL PLATES'), 'Wood-Roast Aubergine, Miso Glaze', '', '£8', 6, true);

-- Insert PIZZAS items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PIZZAS'), 'Margherita', '', '£12', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PIZZAS'), 'Nduja, Ricotta, Hot Honey', '', '£15', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PIZZAS'), 'Prosciutto & Rocket', '', '£15', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PIZZAS'), 'Vegetale', '', '£13', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PIZZAS'), 'Korean BBQ Beef', '', '£18', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PIZZAS'), 'All pizzas boxed, sliced, and good to go', '', '', 6, true);

-- Insert MAINS items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'MAINS'), 'Flat Iron Steak, Chimichurri', 'sliced', '£22', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'MAINS'), 'Half Roast Chicken, Garlic & Lemon', '', '£18', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'MAINS'), 'Iberico Pork Chop, Apple & Mustard', 'sliced', '£28', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'MAINS'), 'Miso Glazed Salmon, Sesame Greens', '', '£28', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'MAINS'), 'Wood Oven Gnocchi, Wild Mushrooms, Parmesan', '', '£20', 5, true);

-- Insert SIDES items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'SIDES'), 'Rosemary Fries', '', '£5', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'SIDES'), 'Wood Oven Potatoes', '', '£6', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'SIDES'), 'Charred Corn, Chilli Butter', '', '£5', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'SIDES'), 'Kimchi Slaw', '', '£5', 4, true);

-- Insert DESSERTS items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'DESSERTS'), 'Churros & Chocolate', '', '£6', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'DESSERTS'), 'Wood Oven Brownie, Vanilla Ice Cream', '', '£7', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'DESSERTS'), 'Polenta & Orange Cake', '', '£5', 3, true);

-- Insert PRE-BUILT (PER HEAD) items
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PRE-BUILT (PER HEAD)'), 'Pizza & Small Plates', 'Mixed pizzas, pork belly, karaage chicken, squid, aubergine, fries, corn, slaw, churros.', '£28pp', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PRE-BUILT (PER HEAD)'), 'The Big Grill', 'Steak, chicken, pork, salmon, gnocchi, potatoes, greens, slaw, brownies.', '£36pp', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PRE-BUILT (PER HEAD)'), 'The Roast (Sundays Only)', 'Beef, chicken, roast of the week, all trimmings, apple pie, jam roly poly.', '£32pp', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-hideout' AND section_name = 'PRE-BUILT (PER HEAD)'), 'The Hideout All-In', 'A bit of everything — pizzas, small plates, grill mains, sides, and a mix of desserts.', '£40pp', 4, true);