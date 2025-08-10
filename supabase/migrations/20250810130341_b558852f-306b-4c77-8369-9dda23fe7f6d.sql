
-- 1) Enums
create type public.notification_status as enum ('draft', 'queued', 'sending', 'sent', 'failed');
create type public.notification_scope as enum ('all', 'self');
create type public.delivery_status as enum ('sent', 'failed', 'deactivated');

-- 2) Notifications table
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,                      -- no FK to auth.users to avoid client limitations
  created_by_email text,
  title text not null,
  body text not null,
  url text,
  icon text,
  badge text,
  scope public.notification_scope not null default 'all',
  status public.notification_status not null default 'draft',
  dry_run boolean not null default false,
  recipients_count integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  sent_at timestamptz
);

-- Keep updated_at fresh
create trigger trg_notifications_updated_at
before update on public.notifications
for each row
execute procedure public.update_updated_at_column();

-- Indexes
create index notifications_created_at_idx on public.notifications (created_at desc);

-- 3) Per-delivery log table
create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  subscription_id uuid references public.push_subscriptions(id) on delete set null,
  endpoint text not null,
  status public.delivery_status not null,
  error text,
  sent_at timestamptz not null default now()
);

-- Indexes
create index notification_deliveries_notification_id_idx on public.notification_deliveries (notification_id);
create index notification_deliveries_sent_at_idx on public.notification_deliveries (sent_at desc);

-- 4) RLS
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;

-- Allowed-domain users can view notifications
create policy "Allowed-domain users can view notifications"
on public.notifications
for select
to authenticated
using (public.is_email_domain_allowed(public.get_user_email()));

-- Allowed-domain users can create their own notifications
create policy "Allowed-domain users can insert own notifications"
on public.notifications
for insert
to authenticated
with check ((auth.uid() = created_by) and public.is_email_domain_allowed(public.get_user_email()));

-- Allowed-domain users can update their own notifications
create policy "Allowed-domain users can update own notifications"
on public.notifications
for update
to authenticated
using ((auth.uid() = created_by) and public.is_email_domain_allowed(public.get_user_email()));

-- Allowed-domain users can delete their own notifications
create policy "Allowed-domain users can delete own notifications"
on public.notifications
for delete
to authenticated
using ((auth.uid() = created_by) and public.is_email_domain_allowed(public.get_user_email()));

-- Delivery logs are readable to allowed-domain users for auditing and troubleshooting
create policy "Allowed-domain users can view deliveries"
on public.notification_deliveries
for select
to authenticated
using (public.is_email_domain_allowed(public.get_user_email()));
