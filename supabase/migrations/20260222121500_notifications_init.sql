-- Create a notifications table to handle real-time alerts for tenants and owners.
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null default 'info', -- 'info', 'warning', 'payment', 'incident'
    is_read boolean not null default false,
    link text,
    created_at timestamp with time zone not null default now()
);

-- Index for performance when fetching unread notifications
create index if not exists ix_notifications_user_id_unread on public.notifications (user_id) where (is_read = false);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
    on public.notifications
    for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can update their own notifications (mark as read)"
    on public.notifications
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- System/Owner can insert notifications for other users
-- In a real production app, we might use a service role or a specific function
-- For this MVP, we'll allow authenticated users to insert to enable Owner -> Tenant messaging
create policy "Authenticated users can insert notifications"
    on public.notifications
    for insert
    to authenticated
    with check (true);

-- Permissions
grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
