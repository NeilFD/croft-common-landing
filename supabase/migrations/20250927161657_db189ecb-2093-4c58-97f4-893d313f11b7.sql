-- Create trigger function to update lead status when booking is created
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
    
    -- Add activity log entry for the conversion
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
      'Lead converted to booking - Status changed from previous status to won',
      NEW.created_by,
      jsonb_build_object(
        'booking_id', NEW.id,
        'booking_title', NEW.title,
        'previous_status', (SELECT status FROM public.leads WHERE id = NEW.lead_id),
        'new_status', 'won',
        'conversion_date', NEW.created_at
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger on bookings table
DROP TRIGGER IF EXISTS trigger_update_lead_on_booking ON public.bookings;
CREATE TRIGGER trigger_update_lead_on_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_on_booking_creation();