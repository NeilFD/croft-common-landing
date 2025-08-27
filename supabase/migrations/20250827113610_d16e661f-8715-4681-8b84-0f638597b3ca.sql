-- Add auto-approval for admin users to bypass moderation queue
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_email_domain_allowed(get_user_email());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to auto-approve admin uploads
CREATE OR REPLACE FUNCTION public.auto_approve_admin_moments()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is an admin, auto-approve their moments
  IF is_admin_user() THEN
    NEW.moderation_status := 'approved';
    NEW.moderated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_approve_admin_moments ON public.member_moments;
CREATE TRIGGER trigger_auto_approve_admin_moments
  BEFORE INSERT ON public.member_moments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_admin_moments();