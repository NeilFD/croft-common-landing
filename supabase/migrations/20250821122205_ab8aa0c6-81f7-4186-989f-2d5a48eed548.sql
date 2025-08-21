-- Create function to clear WebAuthn data for a user handle
CREATE OR REPLACE FUNCTION public.clear_webauthn_data_for_handle(user_handle_input text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete WebAuthn credentials for this user handle
  DELETE FROM webauthn_credentials 
  WHERE user_handle = user_handle_input;
  
  -- Delete any challenges for this user handle
  DELETE FROM webauthn_challenges 
  WHERE user_handle = user_handle_input;
  
  -- Delete user links for this user handle
  DELETE FROM webauthn_user_links 
  WHERE user_handle = user_handle_input;
  
  -- Log the cleanup
  RAISE NOTICE 'Cleared WebAuthn data for user handle: %', user_handle_input;
END;
$$;