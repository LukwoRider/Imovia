-- Fix advisory errors on public.profiles:
-- - Policy Exists RLS Disabled
-- - RLS Disabled in Public

begin;

alter table if exists public.profiles enable row level security;

do $do$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_own'
  ) then
    execute $sql$
      create policy "profiles_select_own"
      on public.profiles
      as permissive
      for select
      to public
      using (id = public.current_user_id())
    $sql$;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ) then
    execute $sql$
      create policy "profiles_update_own"
      on public.profiles
      as permissive
      for update
      to public
      using (id = public.current_user_id())
      with check (id = public.current_user_id())
    $sql$;
  end if;
end
$do$;

commit;
