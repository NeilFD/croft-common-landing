
ALTER TABLE public.lunch_menu ADD COLUMN IF NOT EXISTS site text NOT NULL DEFAULT 'both';
ALTER TABLE public.lunch_menu ADD CONSTRAINT lunch_menu_site_chk CHECK (site IN ('town','country','both'));

ALTER TABLE public.lunch_orders ADD COLUMN IF NOT EXISTS site text;
ALTER TABLE public.lunch_orders ADD COLUMN IF NOT EXISTS member_name text;
ALTER TABLE public.lunch_orders ADD COLUMN IF NOT EXISTS member_phone text;
ALTER TABLE public.lunch_orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.lunch_orders ADD CONSTRAINT lunch_orders_site_chk CHECK (site IS NULL OR site IN ('town','country'));
