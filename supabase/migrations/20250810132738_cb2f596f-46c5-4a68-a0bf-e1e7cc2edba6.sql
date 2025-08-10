-- Create a public bucket for notification images
insert into storage.buckets (id, name, public)
values ('notifications', 'notifications', true)
on conflict (id) do nothing;

-- Allow public read access to files in the notifications bucket
create policy if not exists "Public can read notification images"
  on storage.objects
  for select
  using (bucket_id = 'notifications');

-- Allow allowed-domain authenticated users to upload images
create policy if not exists "Allowed-domain users can upload notification images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'notifications' and is_email_domain_allowed(get_user_email())
  );

-- Optionally allow updates/deletes by allowed-domain users on their files (scoped by bucket)
create policy if not exists "Allowed-domain users can modify notification images"
  on storage.objects
  for update
  using (bucket_id = 'notifications' and is_email_domain_allowed(get_user_email()))
  with check (bucket_id = 'notifications' and is_email_domain_allowed(get_user_email()));

create policy if not exists "Allowed-domain users can delete notification images"
  on storage.objects
  for delete
  using (bucket_id = 'notifications' and is_email_domain_allowed(get_user_email()));