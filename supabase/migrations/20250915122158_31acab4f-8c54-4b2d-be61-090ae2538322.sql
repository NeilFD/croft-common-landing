-- Clear all existing content for kitchens-halls page
DELETE FROM public.cms_menu_items WHERE section_id IN (
  SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls'
);
DELETE FROM public.cms_menu_sections WHERE page = 'kitchens-halls';
DELETE FROM public.cms_content WHERE page = 'kitchens-halls';

-- Add page title and subtitle for Halls
INSERT INTO public.cms_content (page, section, content_key, content_data, content_type, published) VALUES
('kitchens-halls', 'hero', 'title', '"The Halls — Events Menu"', 'text', true),
('kitchens-halls', 'hero', 'description', '"Bold food. Built for a crowd."', 'text', true);

-- Insert menu sections for Halls
INSERT INTO public.cms_menu_sections (page, section_name, sort_order, published) VALUES
('kitchens-halls', 'Deli Style — Meetings & Conference Lunch', 1, true),
('kitchens-halls', 'Sandwiches (Choose Three)', 2, true),
('kitchens-halls', 'Salads (Choose Three)', 3, true),
('kitchens-halls', 'Sweets (Choose Two)', 4, true),
('kitchens-halls', 'Deli Style Pricing', 5, true),
('kitchens-halls', 'Plated Three Course', 6, true),
('kitchens-halls', 'Starters', 7, true),
('kitchens-halls', 'Mains', 8, true),
('kitchens-halls', 'Desserts', 9, true),
('kitchens-halls', 'Feast Style — Served Down The Table', 10, true),
('kitchens-halls', 'The Common Table — £35pp', 11, true),
('kitchens-halls', 'The Boards — £50pp', 12, true),
('kitchens-halls', 'The Feast — £70pp', 13, true),
('kitchens-halls', 'Bespoke Events', 14, true);

-- Insert Deli Style intro
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Deli Style — Meetings & Conference Lunch'), 'Taken from the Café menu', 'Delivered as platters, bowls, boxes. Charged per head.', '', 1, true);

-- Insert Sandwiches
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Sandwiches (Choose Three)'), 'Italian Deli', 'salami, mortadella, provolone, pickles, ciabatta', '', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Sandwiches (Choose Three)'), 'Reuben', 'salt beef, sauerkraut, Swiss cheese, Russian dressing, rye', '', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Sandwiches (Choose Three)'), 'Caprese', 'buffalo mozzarella, heritage tomato, basil, focaccia', '', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Sandwiches (Choose Three)'), 'The Med', 'roast vegetables, hummus, feta, ciabatta', '', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Sandwiches (Choose Three)'), 'Roast Chicken Caesar', 'chicken, anchovy mayo, parmesan, cos lettuce, sourdough', '', 5, true);

-- Insert Salads
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Salads (Choose Three)'), 'Roast Cauliflower, Tahini, Pomegranate', '', '', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Salads (Choose Three)'), 'Freekeh & Squash Grain Salad', '', '', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Salads (Choose Three)'), 'Charred Broccoli & Almond', '', '', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Salads (Choose Three)'), 'Heritage Tomato & Burrata', '', '', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Salads (Choose Three)'), 'Sesame Soba Noodles', '', '', 5, true);

-- Insert Sweets
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Sweets (Choose Two)'), 'Polenta & Orange Cake', '', '', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Sweets (Choose Two)'), 'Pistachio & Rose Cake', '', '', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Sweets (Choose Two)'), 'Chocolate Babka', '', '', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Sweets (Choose Two)'), 'Date & Walnut Slice', '', '', 4, true);

-- Insert Deli Style Pricing
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Deli Style Pricing'), 'Price: £22 per head', '', '', 1, true);

-- Insert Plated Three Course intro
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Plated Three Course'), 'Organiser selects 3 starters, 3 mains, 3 desserts', 'Guests pre-order. Individually priced, spend builds per guest.', '', 1, true);

-- Insert Starters
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Starters'), 'Charred Octopus, Potato, Aioli', '', '£12', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Starters'), 'Beef Short Rib Croquettes', '', '£10', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Starters'), 'Wood-Roast Aubergine, Miso Glaze', '', '£9', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Starters'), 'Crispy Squid, Lemon, Seaweed Salt', '', '£11', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Starters'), 'Heritage Tomato & Burrata', '', '£10', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Starters'), 'Roast Beetroot, Whipped Goats Cheese, Walnuts', '', '£9', 6, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Starters'), 'Karaage Fried Chicken, Yuzu Mayo', '', '£9', 7, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Starters'), 'Chorizo al Vino', '', '£8', 8, true);

-- Insert Mains
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Mains'), 'Ribeye Steak, Smoked Shallot', '', '£36', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Mains'), 'Roast Cod, Brown Shrimp Butter', '', '£26', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Mains'), 'Braised Beef Short Rib, Mash, Charred Carrot', '', '£24', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Mains'), 'Miso Glazed Salmon, Sesame Greens', '', '£28', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Mains'), 'Iberico Pork Chop, Apple & Mustard', '', '£28', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Mains'), 'Wood Oven Gnocchi, Mushrooms, Parmesan', '', '£20', 6, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Mains'), 'Confit Duck Leg, White Beans & Sausage', '', '£22', 7, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Mains'), 'Charred Aubergine, Tahini & Pomegranate', '', '£18', 8, true);

-- Insert Desserts
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Desserts'), 'Basque Cheesecake, Burnt Top', '', '£9', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Desserts'), 'Wood Oven Brownie, Vanilla Ice Cream', '', '£9', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Desserts'), 'Churros, Dark Chocolate', '', '£8', 3, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Desserts'), 'Sticky Toffee Pudding, Salted Caramel', '', '£9', 4, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Desserts'), 'Apple Pie & Custard', '', '£7', 5, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Desserts'), 'Lemon Tart, Crème Fraîche', '', '£8', 6, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Desserts'), 'Jam Roly Poly & Custard', '', '£7', 7, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Desserts'), 'Bread & Butter Pudding', '', '£7', 8, true);

-- Insert Feast Style intro
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Feast Style — Served Down The Table'), 'Boards of starters, mains and desserts', 'Big, social, abundant. Priced per head.', '', 1, true);

-- Insert The Common Table
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'The Common Table — £35pp'), 'Starters', 'Padron Peppers, Jamón Croquetas, Whipped Cod Roe, Flatbread', '', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'The Common Table — £35pp'), 'Mains', 'Half Roast Chickens, Flat Iron Steak, Charred Broccoli & Almond, Roast Potatoes', '', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'The Common Table — £35pp'), 'Desserts', 'Churros & Chocolate, Wood Oven Brownie', '', 3, true);

-- Insert The Boards
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'The Boards — £50pp'), 'Starters', 'Crispy Squid, Karaage Chicken, Aubergine with Miso, Heritage Tomato & Burrata', '', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'The Boards — £50pp'), 'Mains', 'Iberico Pork Chops, Miso Salmon, Wood Oven Gnocchi, Seasonal Greens, Fries', '', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'The Boards — £50pp'), 'Desserts', 'Basque Cheesecake, Sticky Toffee Pudding, Lemon Tart', '', 3, true);

-- Insert The Feast
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'The Feast — £70pp'), 'Starters', 'Octopus & Aioli, Lamb Chops, Roast Beetroot & Goats Cheese, Charred Cauliflower Salad', '', 1, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'The Feast — £70pp'), 'Mains', 'Ribeye Steak, Whole Seabass, Confit Duck, Charred Aubergine with Tahini', '', 2, true),
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'The Feast — £70pp'), 'Desserts', 'Apple Pie & Custard, Treacle Sponge, Polenta & Orange Cake, Artisan Cheese Board', '', 3, true);

-- Insert Bespoke Events
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published) VALUES
((SELECT id FROM public.cms_menu_sections WHERE page = 'kitchens-halls' AND section_name = 'Bespoke Events'), 'Bespoke curated party and event food available', 'We are here to deliver, we love a challenge.', '', 1, true);