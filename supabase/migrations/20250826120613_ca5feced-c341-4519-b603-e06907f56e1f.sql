-- Production readiness: Fix database function security vulnerabilities
-- Add SECURITY DEFINER functions missing proper search_path protection

-- Fix get_app_setting function
CREATE OR REPLACE FUNCTION public.get_app_setting(setting_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN (SELECT value FROM public.app_settings WHERE key = setting_key);
END;
$function$;

-- Fix cleanup_expired_webauthn_challenges function
CREATE OR REPLACE FUNCTION public.cleanup_expired_webauthn_challenges()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Delete challenges older than 10 minutes (WebAuthn spec allows 5-10 minutes)
  DELETE FROM public.webauthn_challenges WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$function$;

-- Fix handle_new_user_profile function
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'first_name', 
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$function$;

-- Fix clear_webauthn_data_for_handle function
CREATE OR REPLACE FUNCTION public.clear_webauthn_data_for_handle(user_handle_input text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Validate input to prevent injection
  IF user_handle_input IS NULL OR LENGTH(user_handle_input) = 0 THEN
    RAISE EXCEPTION 'Invalid user handle provided';
  END IF;
  
  -- Delete WebAuthn credentials for this user handle
  DELETE FROM public.webauthn_credentials 
  WHERE user_handle = user_handle_input;
  
  -- Delete any challenges for this user handle
  DELETE FROM public.webauthn_challenges 
  WHERE user_handle = user_handle_input;
  
  -- Delete user links for this user handle
  DELETE FROM public.webauthn_user_links 
  WHERE user_handle = user_handle_input;
  
  -- Log the cleanup
  RAISE NOTICE 'Cleared WebAuthn data for user handle: %', user_handle_input;
END;
$function$;

-- Fix get_push_subscribers function
CREATE OR REPLACE FUNCTION public.get_push_subscribers()
 RETURNS TABLE(user_id uuid, email text, first_name text, last_name text, subscriber_name text, platform text, created_at timestamp with time zone, last_seen timestamp with time zone, device_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ps.user_id,
    COALESCE(
      (SELECT au.email FROM auth.users au WHERE au.id = ps.user_id),
      s.email
    ) as email,
    p.first_name,
    p.last_name,
    s.name as subscriber_name,
    ps.platform,
    MIN(ps.created_at) as created_at,
    MAX(ps.last_seen) as last_seen,
    COUNT(*) as device_count
  FROM public.push_subscriptions ps
  LEFT JOIN public.profiles p ON p.user_id = ps.user_id
  LEFT JOIN public.subscribers s ON s.email = (
    SELECT au.email FROM auth.users au WHERE au.id = ps.user_id
  )
  WHERE ps.is_active = true
  GROUP BY 
    ps.user_id, 
    COALESCE(
      (SELECT au.email FROM auth.users au WHERE au.id = ps.user_id),
      s.email
    ),
    p.first_name,
    p.last_name,
    s.name,
    ps.platform
  ORDER BY MIN(ps.created_at) DESC;
END;
$function$;

-- Fix send_welcome_email_on_verification function
CREATE OR REPLACE FUNCTION public.send_welcome_email_on_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  welcome_payload JSONB;
  user_created_recently BOOLEAN := FALSE;
BEGIN
  -- Only proceed if email_confirmed_at changed from NULL to a timestamp
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    
    -- Check if this user was created recently (within the last 5 minutes)
    -- This helps distinguish between new signups and OTP authentication for existing users
    SELECT (NEW.created_at > NOW() - INTERVAL '5 minutes') INTO user_created_recently;
    
    -- Only send welcome email for recently created users (new signups)
    IF user_created_recently THEN
      -- Get required settings
      SELECT value INTO supabase_url FROM public.app_settings WHERE key = 'supabase_url';
      SELECT value INTO service_role_key FROM public.app_settings WHERE key = 'service_role_key';
      
      -- Only proceed if we have the required settings
      IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL AND service_role_key != 'PLACEHOLDER_FOR_SERVICE_ROLE_KEY' THEN
        
        -- Prepare payload for welcome email
        welcome_payload := jsonb_build_object(
          'email', NEW.email,
          'name', COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.email),
          'subscriberId', NEW.id::text
        );
        
        -- Call the send-welcome-email edge function using pg_net
        PERFORM net.http_post(
          url := supabase_url || '/functions/v1/send-welcome-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key
          ),
          body := welcome_payload
        );
        
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix get_or_create_current_release function
CREATE OR REPLACE FUNCTION public.get_or_create_current_release()
 RETURNS cinema_releases
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
declare
  m date := date_trunc('month', now())::date;
  r public.cinema_releases;
begin
  insert into public.cinema_releases (month_key, screening_date)
  values (m, public.get_last_thursday(m))
  on conflict (month_key) do nothing;

  select * into r
  from public.cinema_releases
  where month_key = m;

  return r;
end;
$function$;

-- Fix get_cinema_status function
CREATE OR REPLACE FUNCTION public.get_cinema_status()
 RETURNS TABLE(release_id uuid, month_key date, screening_date date, doors_time time without time zone, screening_time time without time zone, capacity integer, tickets_sold integer, tickets_left integer, is_sold_out boolean, title text, description text, poster_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
declare
  r public.cinema_releases;
  sold int;
begin
  r := public.get_or_create_current_release();

  select coalesce(sum(b.quantity), 0)
  into sold
  from public.cinema_bookings b
  where b.release_id = r.id;

  return query
  select
    r.id as release_id,
    r.month_key,
    r.screening_date,
    r.doors_time,
    r.screening_time,
    r.capacity::int,
    sold,
    greatest(r.capacity - sold, 0) as tickets_left,
    (sold >= r.capacity) as is_sold_out,
    r.title,
    r.description,
    r.poster_url;
end;
$function$;

-- Fix create_cinema_booking function
CREATE OR REPLACE FUNCTION public.create_cinema_booking(_user_id uuid, _email text, _primary_name text, _guest_name text, _quantity smallint)
 RETURNS TABLE(booking_id uuid, release_id uuid, ticket_numbers smallint[], tickets_left integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
declare
  r public.cinema_releases;
  sold int;
  start_num int;
  nums smallint[];
  cap int;
  lock_key bigint;
begin
  -- Input validation
  IF _email IS NULL OR LENGTH(TRIM(_email)) = 0 OR _email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Valid email address is required';
  END IF;
  
  IF _primary_name IS NULL OR LENGTH(TRIM(_primary_name)) = 0 THEN
    RAISE EXCEPTION 'Primary name is required';
  END IF;
  
  if _quantity not in (1,2) then
    raise exception 'Quantity must be 1 or 2';
  end if;

  if _quantity = 2 and (coalesce(btrim(_guest_name), '') = '') then
    raise exception 'Guest name is required when booking 2 tickets';
  end if;

  r := public.get_or_create_current_release();
  cap := r.capacity;

  -- Advisory transaction lock
  select ('x' || substr(md5(r.id::text), 1, 16))::bit(64)::bigint into lock_key;
  perform pg_advisory_xact_lock(lock_key);

  -- prevent duplicate bookings per month per user/email
  if exists (
    select 1 from public.cinema_bookings b
    where b.release_id = r.id
      and (b.user_id = _user_id or lower(b.email) = lower(_email))
  ) then
    raise exception 'You have already booked tickets for this month';
  end if;

  select coalesce(sum(b.quantity), 0) into sold
  from public.cinema_bookings b
  where b.release_id = r.id;

  if sold + _quantity > cap then
    raise exception 'Sold out or not enough tickets left';
  end if;

  start_num := sold + 1;

  select array_agg(g::smallint) into nums
  from generate_series(start_num, start_num + _quantity - 1) g;

  insert into public.cinema_bookings (release_id, user_id, email, primary_name, guest_name, quantity, ticket_numbers)
  values (r.id, _user_id, _email, _primary_name, nullif(btrim(_guest_name), ''), _quantity, nums)
  returning id into booking_id;

  return query
  select booking_id, r.id as release_id, nums,
         greatest(cap - (sold + _quantity), 0) as tickets_left;
end;
$function$;

-- Fix update_push_subscription_user_info function
CREATE OR REPLACE FUNCTION public.update_push_subscription_user_info()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  full_name text;
  subscriber_name text;
  user_email text;
BEGIN
  -- Clear values first
  NEW.user_email := NULL;
  NEW.user_full_name := NULL;
  
  -- Only process if user_id is set
  IF NEW.user_id IS NOT NULL THEN
    -- Get user email from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    NEW.user_email := user_email;
    
    -- Try to get full name from profiles table
    SELECT TRIM(CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')))
    INTO full_name
    FROM public.profiles 
    WHERE user_id = NEW.user_id
    AND (first_name IS NOT NULL OR last_name IS NOT NULL);
    
    IF full_name IS NOT NULL AND full_name != '' THEN
      NEW.user_full_name := full_name;
    ELSE
      -- Fallback to subscriber name matched by email
      IF user_email IS NOT NULL THEN
        SELECT s.name 
        INTO subscriber_name
        FROM public.subscribers s 
        WHERE s.email = user_email
        AND s.name IS NOT NULL;
        
        IF subscriber_name IS NOT NULL THEN
          NEW.user_full_name := subscriber_name;
        ELSE
          -- Final fallback to email as display name
          NEW.user_full_name := user_email;
        END IF;
      END IF;
    END IF;
  ELSE
    NEW.user_full_name := 'Anonymous User';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix is_email_domain_allowed function
CREATE OR REPLACE FUNCTION public.is_email_domain_allowed(email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Input validation
  IF email IS NULL OR LENGTH(TRIM(email)) = 0 THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.allowed_domains 
    WHERE domain = SPLIT_PART(email, '@', 2)
  );
END;
$function$;

-- Fix get_user_email function
CREATE OR REPLACE FUNCTION public.get_user_email()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid());
END;
$function$;

-- Fix verify_event_management_token function
CREATE OR REPLACE FUNCTION public.verify_event_management_token(token_input text, event_id_input uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Input validation
  IF token_input IS NULL OR LENGTH(TRIM(token_input)) = 0 OR event_id_input IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = event_id_input AND management_token = token_input
  );
END;
$function$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cinema_bookings_release_user ON public.cinema_bookings(release_id, user_id);
CREATE INDEX IF NOT EXISTS idx_cinema_bookings_release_email ON public.cinema_bookings(release_id, email);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subscribers_active_email ON public.subscribers(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON public.notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);

-- Add constraints for data integrity
ALTER TABLE public.subscribers
ADD CONSTRAINT IF NOT EXISTS check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.events
ADD CONSTRAINT IF NOT EXISTS check_contact_email_format 
CHECK (contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE public.events
ADD CONSTRAINT IF NOT EXISTS check_management_email_format 
CHECK (management_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');