-- Add sample recipe data to CMS for demonstration

-- Insert recipe metadata for a few sample recipes
INSERT INTO public.cms_content (page, section, content_key, content_type, content_data, published)
VALUES
-- Marinated Gordal Olives recipe
('kitchens-recipes', 'marinated-gordal-olives', 'metadata', 'json', '{
  "title": "Marinated Gordal Olives, Orange Zest",
  "serves": "4-6",
  "time": "15 minutes",
  "category": "Bites",
  "allergens": ["none"],
  "difficulty": "Easy"
}', true),

('kitchens-recipes', 'marinated-gordal-olives', 'the-idea', 'text', '{
  "text": "These Spanish Gordal olives are the perfect way to start any meal. Their plump, meaty texture combined with bright orange zest creates an elegant bite that awakens the palate. Simple ingredients, maximum impact - that''s the Croft Common way."
}', true),

('kitchens-recipes', 'marinated-gordal-olives', 'youll-need', 'json', '{
  "items": [
    "300g Gordal olives, pitted",
    "Zest of 2 large oranges",
    "3 tbsp extra virgin olive oil",
    "1 clove garlic, thinly sliced",
    "1 sprig fresh thyme",
    "Pinch of sea salt",
    "Freshly ground black pepper"
  ]
}', true),

('kitchens-recipes', 'marinated-gordal-olives', 'the-cook', 'json', '{
  "steps": [
    "Drain the olives and pat dry with kitchen paper.",
    "In a mixing bowl, combine the olives with the orange zest.",
    "Add the olive oil, sliced garlic, and thyme leaves.",
    "Season with a pinch of salt and freshly ground pepper.",
    "Toss gently to coat all the olives evenly.",
    "Let marinate at room temperature for 10 minutes before serving.",
    "Serve in small bowls with cocktail picks."
  ]
}', true),

-- Wood Oven Flatbread recipe
('kitchens-recipes', 'wood-oven-flatbread', 'metadata', 'json', '{
  "title": "Wood Oven Flatbread, Smoked Butter",
  "serves": "4",
  "time": "2 hours (including rise time)",
  "category": "Bites", 
  "allergens": ["gluten", "dairy"],
  "difficulty": "Medium"
}', true),

('kitchens-recipes', 'wood-oven-flatbread', 'the-idea', 'text', '{
  "text": "Our signature flatbread showcases the magic of our wood-fired oven. The high heat creates those beautiful blistered bubbles while the smoked butter from Somerset adds richness that complements the charred, smoky flavours perfectly."
}', true),

('kitchens-recipes', 'wood-oven-flatbread', 'youll-need', 'json', '{
  "items": [
    "500g strong white flour",
    "325ml warm water", 
    "7g active dry yeast",
    "2 tsp sea salt",
    "2 tbsp olive oil",
    "200g Somerset smoked butter, softened",
    "Flaky sea salt for finishing",
    "Fresh rosemary sprigs"
  ]
}', true),

('kitchens-recipes', 'wood-oven-flatbread', 'the-cook', 'json', '{
  "steps": [
    "Dissolve yeast in warm water and let bloom for 5 minutes.",
    "Mix flour and salt in a large bowl, make a well in the center.",
    "Add yeast mixture and olive oil, mix until a shaggy dough forms.",
    "Knead on a floured surface for 8-10 minutes until smooth and elastic.",
    "Place in an oiled bowl, cover, and let rise for 1 hour until doubled.",
    "Divide dough into 4 portions and shape into balls.",
    "Rest for 15 minutes, then roll out into oval shapes.",
    "Fire the wood oven to 400°C (750°F).",
    "Slide flatbreads directly onto the oven floor using a peel.",
    "Bake for 2-3 minutes until puffed and lightly charred.",
    "Brush immediately with smoked butter and sprinkle with salt and rosemary.",
    "Serve warm, torn into pieces."
  ]
}', true);

-- Add some content for other tabs (minimal data for cafe as example)
INSERT INTO public.cms_menu_items (section_id, item_name, description, price, sort_order, published, created_by)
SELECT 
  ms.id,
  items.name,
  items.description,
  items.price,
  items.sort_order,
  true,
  null
FROM (SELECT id, section_name FROM public.cms_menu_sections WHERE page = 'kitchens-cafe') ms
CROSS JOIN LATERAL (
  VALUES 
    -- Breakfast section
    ('Breakfast', 'Croft Common Full English', 'rare breed sausage, smoked bacon, fried egg, tomato, mushroom, beans, sourdough.', '£14', 10),
    ('Breakfast', 'Veggie English', 'field mushroom, halloumi, avocado, roast tomato, beans, sourdough.', '£11', 20),
    ('Breakfast', 'Eggs Benedict', 'poached eggs, ham hock, hollandaise, muffin.', '£12', 30),
    ('Breakfast', 'Avocado & Poached Egg', 'chilli, lime, pumpkin seeds, sourdough.', '£12', 40),
    
    -- Pastries section
    ('Pastries', 'Butter Croissant', 'classic, flaky, French butter.', '£3', 10),
    ('Pastries', 'Pain au Chocolat', 'buttery pastry, dark chocolate.', '£3.50', 20),
    ('Pastries', 'Cinnamon Roll', 'sticky, spiced, glazed.', '£4', 30),
    
    -- Coffee & Beverages section
    ('Coffee & Beverages', 'Espresso', 'double shot, rich and bold.', '£2.50', 10),
    ('Coffee & Beverages', 'Flat White', 'smooth espresso, steamed milk.', '£3.50', 20),
    ('Coffee & Beverages', 'Cappuccino', 'espresso, steamed milk, foam.', '£3.50', 30),
    ('Coffee & Beverages', 'Fresh Orange Juice', 'squeezed to order.', '£4', 40)
) AS items(section_name, name, description, price, sort_order)
WHERE ms.section_name = items.section_name;