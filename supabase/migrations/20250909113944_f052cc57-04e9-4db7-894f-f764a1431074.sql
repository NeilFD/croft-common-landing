-- Create or update trigger for lunch order ledger entries and streak tracking
CREATE OR REPLACE FUNCTION public.add_lunch_order_to_ledger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only process if order is confirmed (not pending)
  IF NEW.status = 'confirmed' AND (OLD IS NULL OR OLD.status != 'confirmed') THEN
    
    -- Add to ledger
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
    VALUES (
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

-- Create trigger for lunch orders (replace existing if it exists)
DROP TRIGGER IF EXISTS trigger_add_lunch_order_to_ledger ON public.lunch_orders;
CREATE TRIGGER trigger_add_lunch_order_to_ledger
  AFTER INSERT OR UPDATE ON public.lunch_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.add_lunch_order_to_ledger();

-- Set up cron job for daily order schedule
SELECT cron.schedule(
  'send-daily-lunch-schedule',
  '0 15 * * 1-5', -- 3:00 PM Monday to Friday (for testing, change to '0 11 * * 1-5' for 11 AM production)
  $$
  SELECT
    net.http_post(
        url:='https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/send-daily-order-schedule',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- Ensure unique constraint exists for member check-ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'member_check_ins_user_id_check_in_date_key'
  ) THEN
    ALTER TABLE public.member_check_ins 
    ADD CONSTRAINT member_check_ins_user_id_check_in_date_key 
    UNIQUE (user_id, check_in_date);
  END IF;
END $$;