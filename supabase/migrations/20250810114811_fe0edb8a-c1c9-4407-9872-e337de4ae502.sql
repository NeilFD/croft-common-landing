-- Add croftcommon.co.uk to allowed_domains if not already present
insert into public.allowed_domains (domain)
select 'croftcommon.co.uk'
where not exists (
  select 1 from public.allowed_domains where domain = 'croftcommon.co.uk'
);
