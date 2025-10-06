-- Create public storage bucket for chat images and policies
-- Ensures chat attachments render with public URLs

-- 1) Create bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

-- 2) Policies on storage.objects (create only if missing)
-- Public read for chat-images
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'storage'
      and p.tablename = 'objects'
      and p.policyname = 'Public read chat-images'
  ) then
    create policy "Public read chat-images"
    on storage.objects for select
    using (bucket_id = 'chat-images');
  end if;
end
$$;

-- Users can upload to their own folder in chat-images
-- Path format: <auth.uid()>/<filename>
do $$
begin
  if not exists (
    select 1 from pg_policies p
    where p.schemaname = 'storage'
      and p.tablename = 'objects'
      and p.policyname = 'Upload own chat-images'
  ) then
    create policy "Upload own chat-images"
    on storage.objects for insert
    with check (
      bucket_id = 'chat-images'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end
$$;

-- Users can update files in their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'storage'
      AND p.tablename = 'objects'
      AND p.policyname = 'Update own chat-images'
  ) THEN
    CREATE POLICY "Update own chat-images"
    ON storage.objects FOR update
    USING (
      bucket_id = 'chat-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END
$$;

-- Users can delete files in their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'storage'
      AND p.tablename = 'objects'
      AND p.policyname = 'Delete own chat-images'
  ) THEN
    CREATE POLICY "Delete own chat-images"
    ON storage.objects FOR delete
    USING (
      bucket_id = 'chat-images'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END
$$;