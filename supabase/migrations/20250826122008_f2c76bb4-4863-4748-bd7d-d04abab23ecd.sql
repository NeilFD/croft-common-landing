-- Fix remaining database security issues

-- Fix the remaining functions with mutable search_path
CREATE OR REPLACE FUNCTION public.get_last_thursday(month_start date)
 RETURNS date
 LANGUAGE plpgsql
 STABLE
 SET search_path = ''
AS $function$
declare
  last_day date := (date_trunc('month', month_start) + interval '1 month - 1 day')::date;
  off int := ((extract(dow from last_day)::int - 4 + 7) % 7); -- Thursday = 4
begin
  return last_day - off;
end;
$function$;

CREATE OR REPLACE FUNCTION public.trigger_cleanup_webauthn_challenges()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  -- Clean up old challenges before inserting new ones
  PERFORM public.cleanup_expired_webauthn_challenges();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.verify_unsubscribe_token(token_input text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 
    FROM public.subscribers 
    WHERE (id::text = token_input OR unsubscribe_token = token_input)
    AND is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_subscriber_for_unsubscribe(token_input text)
 RETURNS TABLE(subscriber_id uuid, email text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT id, email
  FROM public.subscribers 
  WHERE (id::text = token_input OR unsubscribe_token = token_input)
  AND is_active = true
  LIMIT 1;
$function$;