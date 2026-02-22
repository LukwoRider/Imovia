-- Add sender_id to notifications to allow senders to view their own sent notifications
-- and bypass RLS selection issues when inserting.

alter table public.notifications 
add column if not exists sender_id uuid references auth.users(id) on delete set null;

-- Update RLS policies to allow senders to view their sent notifications
drop policy if exists "Users can view their own notifications" on public.notifications;

create policy "Users can view notifications they received or sent"
    on public.notifications
    for select
    to authenticated
    using (auth.uid() = user_id or auth.uid() = sender_id);

-- Ensure insert policy is robust
drop policy if exists "Authenticated users can insert notifications" on public.notifications;

create policy "Authenticated users can insert notifications"
    on public.notifications
    for insert
    to authenticated
    with check (true);
