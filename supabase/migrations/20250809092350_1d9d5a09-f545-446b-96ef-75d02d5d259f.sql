-- Set the current month's Secret Cinema film title
update public.cinema_releases
set title = 'Dirty Dancing'
where month_key = date_trunc('month', now())::date;