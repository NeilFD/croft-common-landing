-- Fix the trigger function to handle author_id properly
CREATE OR REPLACE FUNCTION public.update_lead_on_booking_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only proceed if the booking has a lead_id
  IF NEW.lead_id IS NOT NULL THEN
    -- Update the lead status to 'won'
    UPDATE public.leads 
    SET status = 'won', updated_at = now()
    WHERE id = NEW.lead_id;
    
    -- Add activity log entry for the conversion (with NULL author_id since this is system-generated)
    INSERT INTO public.lead_activity (
      lead_id,
      type,
      body,
      author_id,
      meta,
      created_at
    ) VALUES (
      NEW.lead_id,
      'status_change',
      'Lead automatically converted to booking - Status changed to won',
      NULL, -- Set to NULL to avoid foreign key constraint issues
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_title', NEW.title,
        'new_status', 'won',
        'conversion_date', NEW.created_at,
        'automated', true
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;