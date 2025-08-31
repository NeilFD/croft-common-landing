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

-- Create view for enhanced admin data with application details
CREATE OR REPLACE VIEW public.secret_kitchen_admin_view AS
SELECT 
  ska.*,
  kvi.business_name as application_business_name,
  kvi.contact_name as application_contact_name,
  kvi.phone as application_phone,
  kvi.business_type,
  kvi.cuisine_style,
  kvi.years_experience,
  kvi.team_size,
  kvi.daily_covers_target,
  kvi.current_location,
  kvi.previous_food_hall_experience,
  kvi.unique_selling_point,
  kvi.social_media_handles,
  kvi.questions_comments
FROM public.secret_kitchen_access ska
LEFT JOIN public.kitchen_vendor_inquiries kvi ON ska.application_id = kvi.id;

-- Grant permissions for the view
GRANT SELECT ON public.secret_kitchen_admin_view TO authenticated;

-- Create RLS policy for the view  
CREATE POLICY "Admins can view enhanced access data" 
ON public.secret_kitchen_admin_view
FOR SELECT 
USING (is_email_domain_allowed(get_user_email()));