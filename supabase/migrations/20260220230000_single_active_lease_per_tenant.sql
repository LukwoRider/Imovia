-- Business rule: one tenant can only have one active affiliated housing at a time.
-- Enforced at DB level on lease memberships and lease status transitions.

begin;

create or replace function public.enforce_single_active_lease_per_tenant_membership()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
declare
  v_tenant_id uuid := coalesce(new.tenant_id, old.tenant_id);
  v_lease_id uuid := coalesce(new.lease_id, old.lease_id);
  v_target_status public.lease_status;
begin
  if tg_op = 'DELETE' then
    return old;
  end if;

  select l.status
    into v_target_status
  from public.leases l
  where l.id = v_lease_id;

  if v_target_status = 'active'::public.lease_status
     and exists (
       select 1
       from public.lease_tenants lt
       join public.leases l on l.id = lt.lease_id
       where lt.tenant_id = v_tenant_id
         and l.status = 'active'::public.lease_status
         and lt.lease_id <> v_lease_id
     ) then
    raise exception 'A tenant can only be affiliated to one active housing';
  end if;

  return new;
end;
$function$;

create or replace function public.enforce_single_active_lease_per_tenant_status()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $function$
begin
  if new.status = 'active'::public.lease_status
     and (tg_op = 'INSERT' or coalesce(old.status, 'draft'::public.lease_status) <> new.status)
     and exists (
       select 1
       from public.lease_tenants this_lt
       join public.lease_tenants other_lt
         on other_lt.tenant_id = this_lt.tenant_id
        and other_lt.lease_id <> this_lt.lease_id
       join public.leases other_l
         on other_l.id = other_lt.lease_id
       where this_lt.lease_id = new.id
         and other_l.status = 'active'::public.lease_status
     ) then
    raise exception 'A tenant can only be affiliated to one active housing';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_enforce_single_active_lease_membership on public.lease_tenants;
create trigger trg_enforce_single_active_lease_membership
before insert or update of lease_id, tenant_id on public.lease_tenants
for each row
execute function public.enforce_single_active_lease_per_tenant_membership();

drop trigger if exists trg_enforce_single_active_lease_status on public.leases;
create trigger trg_enforce_single_active_lease_status
before insert or update of status on public.leases
for each row
execute function public.enforce_single_active_lease_per_tenant_status();

commit;
