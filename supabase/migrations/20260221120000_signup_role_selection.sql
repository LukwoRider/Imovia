-- Allow frontend role selection at signup (tenant/owner/agency) via auth metadata.
-- Keep admin role internal and prevent users from changing their role directly afterward.

begin;

create or replace function public.signup_role_from_metadata(p_raw jsonb)
returns public.user_role
language plpgsql
immutable
set search_path = public, pg_catalog
as $function$
declare
  v_role text := lower(coalesce(p_raw->>'role', ''));
begin
  if v_role in ('tenant', 'owner', 'agency') then
    return v_role::public.user_role;
  end if;

  return 'tenant'::public.user_role;
end;
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    public.signup_role_from_metadata(new.raw_user_meta_data),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$function$;

create or replace function public.prevent_direct_profile_role_change()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
begin
  if new.role is distinct from old.role
     and old.id = public.current_user_id() then
    raise exception 'Role cannot be changed directly after signup';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_profiles_prevent_direct_role_change on public.profiles;
create trigger trg_profiles_prevent_direct_role_change
before update of role on public.profiles
for each row
execute function public.prevent_direct_profile_role_change();

commit;
