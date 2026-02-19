begin;

-- 1) Avoid SECURITY DEFINER view exposure warnings.
alter view if exists public.owner_kpis set (security_invoker = true);
alter view if exists public.owner_open_works set (security_invoker = true);
alter view if exists public.owner_overdue_payments set (security_invoker = true);
alter view if exists public.owner_open_incidents set (security_invoker = true);

-- 2) Fix mutable search_path warnings on SQL helper functions.
create or replace function public.current_user_id()
returns uuid
language sql
stable
set search_path = pg_catalog
as $function$
  select auth.uid()
$function$;

create or replace function public.storage_lease_id_from_path(p_path text)
returns uuid
language sql
stable
set search_path = pg_catalog
as $function$
  select nullif(split_part(p_path, '/', 2), '')::uuid
$function$;

commit;
