-- Add applicant tracking columns to secret_kitchen_access table
ALTER TABLE public.secret_kitchen_access 
ADD COLUMN has_applied boolean DEFAULT false,
ADD COLUMN application_date timestamp with time zone,
ADD COLUMN calendly_booked boolean DEFAULT false, 
ADD COLUMN calendly_booking_date timestamp with time zone,
ADD COLUMN application_id uuid REFERENCES public.kitchen_vendor_inquiries(id);

-- Create function to update access status when application is submitted
CREATE OR REPLACE FUNCTION public.update_access_on_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update secret_kitchen_access when a vendor inquiry is submitted
  UPDATE public.secret_kitchen_access 
  SET 
    has_applied = true,
    application_date = NEW.created_at,
    application_id = NEW.id,
    updated_at = now()
  WHERE email = NEW.email AND is_active = true;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically update access status
CREATE TRIGGER trigger_update_access_on_application
  AFTER INSERT ON public.kitchen_vendor_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_access_on_application();

-- Create function to manually update meeting booking status
CREATE OR REPLACE FUNCTION public.update_meeting_status(
  user_email text,
  booking_status boolean,
  booking_date timestamp with time zone DEFAULT now()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Input validation
  IF user_email IS NULL OR LENGTH(TRIM(user_email)) = 0 THEN
    RETURN false;
  END IF;
  
  -- Update meeting status
  UPDATE public.secret_kitchen_access 
  SET 
    calendly_booked = booking_status,
    calendly_booking_date = CASE WHEN booking_status THEN booking_date ELSE NULL END,
    updated_at = now()
  WHERE email = user_email AND is_active = true;
  
  RETURN FOUND;
END;
$function$;