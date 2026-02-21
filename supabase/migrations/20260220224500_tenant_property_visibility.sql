-- Allow tenants to read properties that are linked to their leases.
-- This supports "My Home" screens after property status changes to rented.

begin;

drop policy if exists properties_tenant_select_if_member on public.properties;
create policy properties_tenant_select_if_member
on public.properties
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from public.leases l
    join public.lease_tenants lt on lt.lease_id = l.id
    where l.property_id = properties.id
      and lt.tenant_id = public.current_user_id()
  )
);

commit;
