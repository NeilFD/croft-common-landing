-- Fix the lunch availability trigger to count sandwiches instead of orders
CREATE OR REPLACE FUNCTION public.update_lunch_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sandwich_count INTEGER := 0;
  item JSONB;
BEGIN
  -- Calculate total sandwich quantity from the items JSON
  IF NEW.items IS NOT NULL THEN
    FOR item IN SELECT jsonb_array_elements(NEW.items)
    LOOP
      -- Only count items where category is 'sandwich'
      IF (item->>'category')::text = 'sandwich' THEN
        sandwich_count := sandwich_count + COALESCE((item->>'quantity')::integer, 0);
      END IF;
    END LOOP;
  END IF;
  
  -- Only proceed if there are sandwiches to count
  IF sandwich_count > 0 THEN
    -- Insert or update availability for the order date and slot
    INSERT INTO public.lunch_availability (date, slot_time, orders_count, max_orders)
    VALUES (NEW.order_date, NEW.collection_time, sandwich_count, 10)
    ON CONFLICT (date, slot_time) 
    DO UPDATE SET 
      orders_count = lunch_availability.orders_count + sandwich_count,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;