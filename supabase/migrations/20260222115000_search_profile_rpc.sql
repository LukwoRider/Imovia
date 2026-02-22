-- Create a secure RPC to find a profile ID by email to facilitate linking.
-- This allows owners to link existing tenants by their email address.

create or replace function public.get_profile_by_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'phone', p.phone,
    'avatar_url', p.avatar_url,
    'email', au.email
  ) into v_result
  from auth.users au
  join public.profiles p on p.id = au.id
  where au.email = lower(btrim(p_email))
    and p.role = 'tenant';
  
  return v_result;
end;
$$;

-- Add a new RPC to fetch all available tenants for the selection list.
create or replace function public.get_all_tenants()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_result jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'phone', p.phone,
      'avatar_url', p.avatar_url,
      'email', au.email
    )
  ) into v_result
  from auth.users au
  join public.profiles p on p.id = au.id
  where p.role = 'tenant';
  
  return coalesce(v_result, '[]'::jsonb);
end;
$$;

-- Ensure correct permissions
revoke execute on function public.get_profile_by_email(text) from public;
grant execute on function public.get_profile_by_email(text) to authenticated;

revoke execute on function public.get_all_tenants() from public;
grant execute on function public.get_all_tenants() to authenticated;
