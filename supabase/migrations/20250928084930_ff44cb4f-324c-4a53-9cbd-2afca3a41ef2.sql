-- Backfill event 2025002 with Michael Brown lead details (corrected budget format)
UPDATE public.management_events 
SET 
  lead_id = '5077a649-0fc8-4692-a795-a527c1d48542',
  client_name = 'Michael Brown',
  client_email = 'michael.brown@techcorp.com',
  client_phone = '07987 654321',
  updated_at = NOW()
WHERE id = '570ff764-0536-43a5-b928-7d103b56978a';