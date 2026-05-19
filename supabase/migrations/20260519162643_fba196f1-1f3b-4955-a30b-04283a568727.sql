
-- Retire old country/pub SEO rows (routes now redirect to /pub*).
DELETE FROM public.seo_pages WHERE route IN (
  '/country/pub',
  '/country/pub/food',
  '/country/pub/drink',
  '/country/pub/hospitality'
);

-- Insert SEO rows for the new /pub enclave.
INSERT INTO public.seo_pages (route, label, title, description, h1, keywords)
VALUES
  (
    '/pub',
    'The Pub',
    'The Pub | Crazy Bear Country',
    'Real ale, proper food, fires lit. The pub at Crazy Bear Country, Stadhampton. Cask ale, pub snacks, Sunday roast.',
    'The Pub',
    ARRAY['pub','country pub','stadhampton','crazy bear','real ale','sunday roast']
  ),
  (
    '/pub/food',
    'Pub Food',
    'Pub Food | The Pub | Crazy Bear Country',
    'Pub food, properly done. Pies, roasts, chops, fish. Lunch and dinner every day at The Pub, Crazy Bear Country.',
    'Pub Food',
    ARRAY['pub food','steak and ale pie','sunday roast','oxfordshire pub','stadhampton']
  ),
  (
    '/pub/drink',
    'Pub Drink',
    'Pub Drink | The Pub | Crazy Bear Country',
    'Cask ale, proper wine, cocktails that bite back. The bar at The Pub, Crazy Bear Country, Stadhampton.',
    'The Bar',
    ARRAY['cask ale','real ale','pub bar','oxfordshire','hook norton','stadhampton']
  ),
  (
    '/pub/snacks',
    'Bar Snacks',
    'Bar Snacks | The Pub | Crazy Bear Country',
    'Pork pie. Scotch egg. Pickled egg. Scratchings. Bar snacks done properly at The Pub, Crazy Bear Country.',
    'Bar Snacks',
    ARRAY['pub snacks','pork pie','scotch egg','pork scratchings','pickled egg']
  )
ON CONFLICT (route) DO UPDATE
SET
  label = EXCLUDED.label,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  h1 = EXCLUDED.h1,
  keywords = EXCLUDED.keywords,
  updated_at = now();
