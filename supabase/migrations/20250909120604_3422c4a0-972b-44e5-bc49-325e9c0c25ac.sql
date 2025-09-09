-- Fix the ON CONFLICT issue in the ledger trigger
CREATE OR REPLACE FUNCTION public.add_lunch_order_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if order is confirmed (not pending)
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Add to ledger with proper duplicate prevention using WHERE NOT EXISTS
    INSERT INTO public.member_ledger (
      user_id, 
      activity_type, 
      activity_date, 
      amount, 
      currency, 
      description, 
      related_id, 
      metadata
    )
    SELECT 
      NEW.user_id,
      'lunch_order',
      NEW.order_date,
      NEW.total_amount,
      'GBP',
      'Lunch Run order - £' || NEW.total_amount::text,
      NEW.id,
      jsonb_build_object(
        'collection_time', NEW.collection_time,
        'items', NEW.items,
        'member_name', NEW.member_name
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM public.member_ledger 
      WHERE related_id = NEW.id AND activity_type = 'lunch_order'
    );
    
    -- Add check-in for streak if spend is £8 or more
    IF NEW.total_amount >= 8.00 THEN
      -- Insert check-in only if one doesn't exist for this date
      INSERT INTO public.member_check_ins (
        user_id,
        check_in_date,
        entrance_slug,
        streak_day
      )
      VALUES (
        NEW.user_id,
        NEW.order_date,
        'lunch_run',
        1  -- Will be updated by streak calculation trigger
      )
      ON CONFLICT (user_id, check_in_date) DO NOTHING;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$function$;