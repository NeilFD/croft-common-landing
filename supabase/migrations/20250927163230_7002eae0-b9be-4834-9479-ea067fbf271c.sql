-- Set Neil Fincham-Dukes lead to won status
UPDATE public.leads 
SET status = 'won', updated_at = now()
WHERE id = '0fe959f6-92ce-414d-86e4-9ce4366ae045';

-- Add activity entry using a valid type
INSERT INTO public.lead_activity (lead_id, type, body, author_id, meta, created_at)
VALUES (
  '0fe959f6-92ce-414d-86e4-9ce4366ae045',
  'note',
  'Lead manually marked as won - converted to booking',
  NULL,
  jsonb_build_object(
    'manual_status_change', true,
    'previous_status', 'new',
    'new_status', 'won',
    'reason', 'Lead converted to booking'
  ),
  now()
);