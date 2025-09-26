-- Purge obsolete venues and their related walk entries
-- 1) Delete dependent walk entries
WITH doomed AS (
  SELECT id FROM public.venues
  WHERE lower(name) IN (
    'full court press',
    'llandoger trow',
    'grain barge',
    'pieminister stokes croft',
    'the glassboat',
    'the hatchet inn',
    'watershed cafe'
  )
)
DELETE FROM public.walk_entries WHERE venue_id IN (SELECT id FROM doomed);

-- 2) Delete the venues themselves
WITH doomed AS (
  SELECT id FROM public.venues
  WHERE lower(name) IN (
    'full court press',
    'llandoger trow',
    'grain barge',
    'pieminister stokes croft',
    'the glassboat',
    'the hatchet inn',
    'watershed cafe'
  )
)
DELETE FROM public.venues WHERE id IN (SELECT id FROM doomed);
