-- Create public bucket for notifications images
insert into storage.buckets (id, name, public)
values ('notifications', 'notifications', true)
on conflict (id) do nothing;

-- Policies
create policy "Public can read notification images"
  on storage.objects
  for select
  using (bucket_id = 'notifications');

create policy "Allowed-domain users can upload notification images"
  on storage.objects
  for insert
  with check (bucket_id = 'notifications' and is_email_domain_allowed(get_user_email()));

create policy "Allowed-domain users can modify notification images"
  on storage.objects
  for update
  using (bucket_id = 'notifications' and is_email_domain_allowed(get_user_email()))
  with check (bucket_id = 'notifications' and is_email_domain_allowed(get_user_email()));

create policy "Allowed-domain users can delete notification images"
  on storage.objects
  for delete
  using (bucket_id = 'notifications' and is_email_domain_allowed(get_user_email()));