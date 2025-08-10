
-- Allow notifications admin users from thehive-hospitality.com
insert into public.allowed_domains (domain)
select 'thehive-hospitality.com'
where not exists (
  select 1 from public.allowed_domains
  where lower(domain) = 'thehive-hospitality.com'
);
